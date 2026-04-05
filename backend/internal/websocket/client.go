// internal/websocket/client.go
package websocket

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
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
	userID  string
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

	// validate UUID format (ไม่ต้องแปลงเป็น uuid.UUID แค่ตรวจว่า valid)
	if _, err := uuid.Parse(cardIDStr); err != nil {
		log.Printf("Invalid card ID: %s", cardIDStr)
		return
	}
	if _, err := uuid.Parse(newColumnIDStr); err != nil {
		log.Printf("Invalid column ID: %s", newColumnIDStr)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
	defer cancel()

	// ตรวจสอบ category ของ column เพื่อกำหนด isDone
	category, err := c.hub.queries.GetColumnCategory(ctx, newColumnIDStr)
	if err != nil {
		log.Printf("Failed to get column category: %v", err)
		return
	}

	isDone := category == "DONE"
	var completedAt *time.Time
	if isDone {
		now := time.Now()
		completedAt = &now
	}

	if err := c.hub.queries.UpdateCardColumn(ctx, db.UpdateCardColumnParams{
		ColumnID:    newColumnIDStr,
		Position:    position,
		IsDone:      isDone,
		CompletedAt: util.TimeToTimestamptz(completedAt), // *time.Time → pgtype.Timestamptz
		ID:          cardIDStr,
	}); err != nil {
		log.Printf("Failed to update card position and status: %v", err)
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

	// validate UUID format
	if _, err := uuid.Parse(columnIDStr); err != nil {
		log.Printf("Invalid column ID: %s", columnIDStr)
		return
	}
	if _, err := uuid.Parse(c.userID); err != nil {
		log.Printf("Invalid creator ID: %s", c.userID)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
	defer cancel()

	priority, _ := payload["priority"].(string)

	// FIX: CreatedBy เป็น *string ใน sqlc ตอนนี้ ส่ง &c.userID ได้โดยตรง
	// บัคเดิม: ใช้ uuid.UUID (google) ซึ่งเป็น [16]byte แต่ sqlc ต้องการ pgtype.UUID ซึ่งเป็น struct ต่างชนิด
	newCard, err := c.hub.queries.CreateCard(ctx, db.CreateCardParams{
		ColumnID:  columnIDStr,
		Title:     title,
		Position:  0,
		Priority:  util.StringToPtr(priority),
		CreatedBy: &c.userID, // *string — ถูกต้อง ไม่ต้องแปลงผ่าน uuid.UUID อีกต่อไป
	})
	if err != nil {
		log.Printf("Failed to create card: %v", err)
		return
	}

	broadcastMsg := WSMessage{
		Type: "CARD_CREATED",
		Payload: map[string]interface{}{
			"id":         newCard.ID,
			"column_id":  newCard.ColumnID,
			"title":      newCard.Title,
			"position":   newCard.Position,
			"priority":   newCard.Priority,
			"created_by": newCard.CreatedBy,
		},
	}

	msgBytes, err := json.Marshal(broadcastMsg)
	if err != nil {
		log.Printf("Failed to marshal CARD_CREATED broadcast: %v", err)
		return
	}

	c.hub.broadcast <- BroadcastMessage{BoardID: c.boardID, Message: msgBytes}
}

func (c *Client) handleCardDeleted(payload map[string]interface{}, rawMsg []byte) {
	cardIDStr, ok := payload["card_id"].(string)
	if !ok {
		log.Println("Invalid payload for CARD_DELETED")
		return
	}

	if _, err := uuid.Parse(cardIDStr); err != nil {
		log.Printf("Invalid card ID: %s", cardIDStr)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
	defer cancel()

	if err := c.hub.queries.DeleteCard(ctx, cardIDStr); err != nil {
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
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)

	client := &Client{
		hub:     hub,
		conn:    conn,
		send:    make(chan []byte, 256),
		boardID: boardID,
		userID:  userID,
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

	title, _ := payload["title"].(string)
	description, _ := payload["description"].(string)
	dueDate, _ := payload["due_date"].(string)
	assigneeID, _ := payload["assignee_id"].(string)
	priority, _ := payload["priority"].(string)
	estimatedHours, _ := payload["estimated_hours"].(float64)

	ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
	defer cancel()

	_, err := c.hub.queries.UpdateCard(ctx, db.UpdateCardParams{
		ID:             cardIDStr,
		Title:          title,
		Description:    util.StringToPtr(description),
		DueDate:        util.StringToTimePtr(dueDate),   // string → *time.Time
		AssigneeID:     util.StringToPtr(assigneeID),    // string → *string
		Priority:       util.StringToPtr(priority),
		EstimatedHours: util.FloatToPgNumeric(estimatedHours),
	})
	if err != nil {
		log.Printf("Failed to update card [%s]: %v", cardIDStr, err)
		return
	}

	log.Printf("Updated card [%s] successfully", cardIDStr)
	c.hub.broadcast <- BroadcastMessage{BoardID: c.boardID, Message: rawMsg}
}

func (c *Client) handleSubtaskUpdate(payload map[string]interface{}, rawMsg []byte) {
	subtaskID, _ := payload["subtask_id"].(string)
	isDone, _ := payload["is_done"].(bool)
	title, _ := payload["title"].(string)
	position, _ := payload["position"].(float64)

	ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
	defer cancel()

	_, err := c.hub.queries.UpdateSubtask(ctx, db.UpdateSubtaskParams{
		ID:       subtaskID,
		Title:    title,
		IsDone:   isDone,
		Position: position,
	})
	if err != nil {
		log.Printf("Error updating subtask [%s]: %v", subtaskID, err)
		return
	}

	c.hub.broadcast <- BroadcastMessage{BoardID: c.boardID, Message: rawMsg}
}

func (c *Client) handleSubtaskToggle(payload map[string]interface{}, rawMsg []byte) {
	subtaskID, _ := payload["subtask_id"].(string)
	isDone, _ := payload["is_done"].(bool)

	// UpdateSubtaskDone มีอยู่จริงแล้วหลังเพิ่ม query ใน queries.sql
	_ = c.hub.queries.UpdateSubtaskDone(context.Background(), db.UpdateSubtaskDoneParams{
		ID:     subtaskID,
		IsDone: isDone,
	})

	c.hub.broadcast <- BroadcastMessage{BoardID: c.boardID, Message: rawMsg}
}
