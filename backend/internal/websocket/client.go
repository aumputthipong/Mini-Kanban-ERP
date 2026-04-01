// internal/websocket/client.go
package websocket

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/pgutil"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgtype"
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
		ColumnID: colUUID,
		Position: position,
		ID:       cardUUID,
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
	newCard, err := c.hub.queries.CreateCard(ctx, db.CreateCardParams{
		ColumnID: colUUID,
		Title:    title,
		Position: 0,
		Priority: pgtype.Text{String: priority, Valid: priority != ""},
	})
	if err != nil {
		log.Printf("Failed to create card: %v", err)
		return
	}

	broadcastMsg := WSMessage{
		Type: "CARD_CREATED",
		Payload: map[string]interface{}{
			"id":        newCard.ID.String(),
			"column_id": newCard.ColumnID.String(),
			"title":     newCard.Title,
			"position":  newCard.Position,
			"priority":  pgutil.TextToPtr(newCard.Priority),
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

	var cardUUID uuid.UUID
	if err := cardUUID.Scan(cardIDStr); err != nil {
		log.Printf("Invalid card ID: %s", cardIDStr)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
	defer cancel()

	if err := c.hub.queries.DeleteCard(ctx, cardUUID); err != nil {
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

    var cardUUID uuid.UUID
    if err := cardUUID.Scan(cardIDStr); err != nil {
        log.Printf("Invalid card ID: %s", cardIDStr)
        return
    }

    title, _          := payload["title"].(string)
    description, _    := payload["description"].(string)
    dueDate, _        := payload["due_date"].(string)
    assigneeID, _     := payload["assignee_id"].(string)
    priority, _       := payload["priority"].(string)
    estimatedHours, _ := payload["estimated_hours"].(float64)

    var estimatedHoursNumeric pgtype.Numeric
    if estimatedHours != 0 {
        estimatedHoursNumeric.Scan(fmt.Sprintf("%f", estimatedHours))
    }

    ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
    defer cancel()

    _, err := c.hub.queries.UpdateCard(ctx, db.UpdateCardParams{
        ID:             cardUUID,
        Title:          title,
        Description:    pgutil.PtrToText(pgutil.NilIfEmpty(description)),
        DueDate:        pgutil.PtrToDate(pgutil.NilIfEmpty(dueDate)),
        AssigneeID:     pgutil.PtrToUUID(pgutil.NilIfEmpty(assigneeID)),
        Priority:       pgutil.PtrToText(pgutil.NilIfEmpty(priority)),
        EstimatedHours: estimatedHoursNumeric,
    })
    if err != nil {
        log.Printf("Failed to update card: %v", err)
        return
    }

    log.Printf("Updated card [%s]", cardIDStr)
    c.hub.broadcast <- BroadcastMessage{BoardID: c.boardID, Message: rawMsg}
}