// internal/websocket/client.go
//
// Connection lifecycle: upgrade HTTP → WebSocket, ReadPump, WritePump และ Client struct.
// Responsibility: จัดการ connection อย่างเดียว — ไม่มี business logic หรือ DB calls.
// Message routing อยู่ใน dispatcher.go / domain handlers แยกเป็นไฟล์ handler_*.go
package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
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

		c.dispatch(wsMsg, message)
	}
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
