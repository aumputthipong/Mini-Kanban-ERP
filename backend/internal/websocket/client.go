package websocket

import (
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

// ตั้งค่า Upgrader เพื่อเปลี่ยน HTTP ธรรมดาเป็น WebSocket
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// ในการพัฒนาจริงควรตรวจเช็ค Origin เพื่อป้องกันความปลอดภัย (CORS)
	// แต่ช่วงทดสอบนี้เราจะอนุญาตทั้งหมดไปก่อน
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Client เป็นตัวแทนของการเชื่อมต่อ 1 รายการ
type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan []byte
}

// ReadPump ดึงข้อความจาก WebSocket ส่งเข้า Hub
func (c *Client) ReadPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		c.hub.broadcast <- message
	}
}

// WritePump ดึงข้อความจาก Hub ส่งออกไปยัง WebSocket
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
				// Hub สั่งปิดการเชื่อมต่อ
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
			// ส่งสัญญาณ Ping เพื่อเช็คว่า Client ยังอยู่
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ServeWs เป็น Endpoint ที่ถูกเรียกเมื่อมีคนเชื่อมต่อเข้ามาที่ URL ของ WebSocket
func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}

	client := &Client{hub: hub, conn: conn, send: make(chan []byte, 256)}
	client.hub.register <- client

	// อนุญาตให้ทำงานพร้อมกันโดยไม่บล็อกกันเอง
	go client.WritePump()
	go client.ReadPump()
}