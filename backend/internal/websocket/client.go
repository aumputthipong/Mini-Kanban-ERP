// internal/websocket/client.go
package websocket

import (
	"context"

	"encoding/json"
	
	"log"
	"net/http"
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/util"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"

)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 4096
	dbTimeout      = 5 * time.Second
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Client struct {
	hub     *Hub
	conn    *websocket.Conn
	send    chan []byte
	boardID string
}

type WSMessage struct {
	Type    string                 `json:"type"`
	Payload map[string]interface{} `json:"payload"`
}

func (c *Client) ReadPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNoStatusReceived) {
				log.Printf("Unexpected websocket error: %v", err)
			}
			break
		}

		var wsMsg WSMessage
		if err := json.Unmarshal(message, &wsMsg); err != nil {
			log.Printf("Invalid JSON format: %v", err)
			continue
		}

		switch wsMsg.Type {
		case "CARD_MOVED":
			c.handleCardMoved(wsMsg.Payload, message)
		case "CARD_CREATED":
			c.handleCardCreated(wsMsg.Payload)
		case "CARD_DELETED":
			c.handleCardDeleted(wsMsg.Payload, message)
		case "CARD_UPDATED":
			c.handleCardUpdated(wsMsg.Payload, message)
		default:
			log.Printf("Unknown message type: %s", wsMsg.Type)
		}
	}
}

func (c *Client) handleCardMoved(payload map[string]interface{}, rawMsg []byte) {
	cardIDStr, ok1 := payload["card_id"].(string)
	newColumnIDStr, ok2 := payload["new_column_id"].(string)
	position, ok3 := payload["position"].(float64)
	if !ok1 || !ok2 || !ok3 {
		log.Println("Invalid payload for CARD_MOVED")
		return
	}

	var cardUUID, colUUID uuid.UUID
	if err := cardUUID.Scan(cardIDStr); err != nil {
		log.Printf("Invalid card ID: %s", cardIDStr)
		return
	}
	if err := colUUID.Scan(newColumnIDStr); err != nil {
		log.Printf("Invalid column ID: %s", newColumnIDStr)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
	defer cancel()

	if err := c.hub.queries.UpdateCardColumn(ctx, db.UpdateCardColumnParams{
		ColumnID: colUUID.String(),
		Position: position,
		ID:       cardUUID.String(),
	}); err != nil {
		log.Printf("Failed to update card position: %v", err)
		return
	}

	log.Printf("Moved card [%s] to column [%s] at position [%f]", cardIDStr, newColumnIDStr, position)
	c.hub.broadcast <- BroadcastMessage{BoardID: c.boardID, Message: rawMsg}
}

func (c *Client) handleCardCreated(payload map[string]interface{}) {
    columnIDStr, ok1 := payload["column_id"].(string)
    title, ok2 := payload["title"].(string)
    if !ok1 || !ok2 {
        log.Println("Invalid payload for CARD_CREATED")
        return
    }

    var colUUID uuid.UUID
    if err := colUUID.Scan(columnIDStr); err != nil {
        log.Printf("Invalid column ID: %s", columnIDStr)
        return
    }

    ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
    defer cancel()
    priority, _ := payload["priority"].(string)
    
    // 1. เรียก CreateCard 
    newCard, err := c.hub.queries.CreateCard(ctx, db.CreateCardParams{
        ColumnID: colUUID.String(),
        Title:    title,
        Position: 0,
        // ✅ เปลี่ยนมาใช้ StringToPtr เพื่อคืนค่ากลับเป็น *string
        Priority: util.StringToPtr(priority), 
    })
    if err != nil {
        log.Printf("Failed to create card: %v", err)
        return
    }

    // 2. จัดเตรียมข้อมูลสำหรับส่งผ่าน WebSocket (Broadcast)
    broadcastMsg := WSMessage{
        Type: "CARD_CREATED",
        Payload: map[string]interface{}{
            "id":        newCard.ID,
            "column_id": newCard.ColumnID,
            "title":     newCard.Title,
            "position":  newCard.Position,
            // ✅ newCard.Priority เป็น *string อยู่แล้ว ส่งเข้า JSON ได้เลย
            // ถ้ามันเป็น nil ตัว JSON Marshal จะแปลงเป็น null ให้เอง (Frontend ชอบมาก)
            "priority":  newCard.Priority, 
        },
    }

    msgBytes, err := json.Marshal(broadcastMsg)
    if err != nil {
        log.Printf("Failed to marshal CARD_CREATED broadcast: %v", err)
        return
    }

    // 3. ส่งข้อความกระจายให้ทุกคนที่เชื่อมต่อ WebSocket ใน Board นี้
    c.hub.broadcast <- BroadcastMessage{BoardID: c.boardID, Message: msgBytes}
}

func (c *Client) handleCardDeleted(payload map[string]interface{}, rawMsg []byte) {
	cardIDStr, ok := payload["card_id"].(string)
	if !ok {
		log.Println("Invalid payload for CARD_DELETED")
		return
	}

	var cardUUID uuid.UUID
	if err := cardUUID.Scan(cardIDStr); err != nil {
		log.Printf("Invalid card ID: %s", cardIDStr)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
	defer cancel()

	if err := c.hub.queries.DeleteCard(ctx, cardUUID.String()); err != nil {
		log.Printf("Failed to delete card: %v", err)
		return
	}

	log.Printf("Deleted card [%s]", cardIDStr)
	c.hub.broadcast <- BroadcastMessage{BoardID: c.boardID, Message: rawMsg}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request, boardID string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}

	client := &Client{
		hub:     hub,
		conn:    conn,
		send:    make(chan []byte, 256),
		boardID: boardID,
	}
	client.hub.register <- client

	go client.WritePump()
	go client.ReadPump()
}

func (c *Client) handleCardUpdated(payload map[string]interface{}, rawMsg []byte) {
	cardIDStr, ok := payload["card_id"].(string)
	if !ok {
		log.Println("Invalid payload for CARD_UPDATED")
		return
	}

	// ดึงข้อมูลจาก payload (ใช้การเช็คแบบสั้น)
	title, _ := payload["title"].(string)
	description, _ := payload["description"].(string)
	dueDate, _ := payload["due_date"].(string)
	assigneeID, _ := payload["assignee_id"].(string)
	priority, _ := payload["priority"].(string)
	estimatedHours, _ := payload["estimated_hours"].(float64)

	ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
	defer cancel()

	// เรียก UpdateCard ด้วย Helper ที่เราสร้างไว้
	_, err := c.hub.queries.UpdateCard(ctx, db.UpdateCardParams{
		ID:             cardIDStr, // ส่ง string ได้เลยเพราะ override แล้ว
		Title:          title,
		Description:    util.StringToPtr(description),      
		DueDate:        util.StringToPgDate(dueDate),       
		AssigneeID:     util.StringToPgUUID(assigneeID),   
		Priority:       util.StringToPtr(priority),         
		EstimatedHours: util.FloatToPgNumeric(estimatedHours),
	})

	if err != nil {
		log.Printf("Failed to update card [%s]: %v", cardIDStr, err)
		return
	}

	log.Printf("Updated card [%s] successfully", cardIDStr)
	
	// ส่ง Message เดิมออกไปให้ทุกคนใน Board
	c.hub.broadcast <- BroadcastMessage{
		BoardID: c.boardID, 
		Message: rawMsg,
	}
}
// ตัวอย่างใน handleSubtaskUpdated (โครงสร้างคล้าย handleCardUpdated)
func (c *Client) handleSubtaskUpdate(payload map[string]interface{}, rawMsg []byte) {
	subtaskID, _ := payload["subtask_id"].(string)
	isDone, _ := payload["is_done"].(bool)
	title, _ := payload["title"].(string)
	
	// ดึงค่า position ถ้าไม่มีให้เริ่มที่ 0 (หรือดึงจาก DB มาก่อนถ้าจำเป็นต้องแม่นยำ)
	position, _ := payload["position"].(float64) 

	ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
	defer cancel()

	// เรียกใช้ UpdateSubtask โดยใช้ Helper
	_, err := c.hub.queries.UpdateSubtask(ctx, db.UpdateSubtaskParams{
		ID:       subtaskID,
		Title:    title,               // ถ้าใน params เป็น string
		// หรือ Title: util.ToNullString(title), // ถ้าใน params เป็น sql.NullString
		IsDone:   isDone,
		Position: position,            // ส่ง float64 เข้าไป (ห้ามใส่ nil)
	})

	if err != nil {
		log.Printf("Error updating subtask [%s]: %v", subtaskID, err)
		return
	}

	// กระจายข่าว
	c.hub.broadcast <- BroadcastMessage{
		BoardID: c.boardID,
		Message: rawMsg,
	}
}

// สมมติชื่อฟังก์ชันใน client.go
func (c *Client) handleSubtaskToggle(payload map[string]interface{}, rawMsg []byte) {
	subtaskID, _ := payload["subtask_id"].(string)
	isDone, _ := payload["is_done"].(bool)

	// 1. สั่ง Database ให้ Update
	_ = c.hub.queries.UpdateSubtaskDone(context.Background(), db.UpdateSubtaskDoneParams{
		ID:     subtaskID,
		IsDone: isDone,
	})

	// 2. ตะโกนบอกทุกคนในบอร์ด (Broadcast)
	c.hub.broadcast <- BroadcastMessage{
		BoardID: c.boardID,
		Message: rawMsg, // ส่งก้อนเดิมนั่นแหละให้คนอื่นไปอัปเดต UI ตาม
	}
}
