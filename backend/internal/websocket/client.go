package websocket

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgtype"
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
	CheckOrigin: func(r *http.Request) bool {
		// return true หมายถึงอนุญาตให้ Next.js (localhost:3000) เชื่อมต่อเข้ามาได้
		return true 
	},
}

// Client เป็นตัวแทนของการเชื่อมต่อ 1 รายการ
type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send    chan []byte
	boardID string
}

type WSMessage struct {
	Type    string                 `json:"type"`
	Payload map[string]interface{} `json:"payload"`
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
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNoStatusReceived) {
				log.Printf("Unexpected websocket error: %v", err)
			}
			break
		}

		// 1. สร้างตัวแปรมารองรับ
		var wsMsg WSMessage

		// 2. แกะกล่อง JSON (Unmarshal) ลงไปในตัวแปร wsMsg
		err = json.Unmarshal(message, &wsMsg)
		if err != nil {
			log.Printf("Invalid JSON format: %v", err)
			continue // ถ้าแกะไม่ได้ ให้ข้ามไปรอรับข้อความรอบถัดไป (อย่าเพิ่งปิดการเชื่อมต่อ)
		}

		// 3. เช็คว่าเป็นคำสั่งอะไร (Best Practice: ใช้ switch case จะอ่านง่ายกว่า if-else)
		switch wsMsg.Type {
		case "CARD_MOVED":
			// 1. ดึงข้อมูลและยืนยันประเภทข้อมูล (Type Assertion)
			cardIDStr, ok1 := wsMsg.Payload["card_id"].(string)
			newColumnIDStr, ok2 := wsMsg.Payload["new_column_id"].(string)

			// ข้อควรระวังใน Go: ตัวเลขจาก JSON interface{} จะถูกแปลงเป็น float64 เสมอ
			position, ok3 := wsMsg.Payload["position"].(float64)

			if ok1 && ok2 && ok3 {
				// 2. แปลง String เป็น UUID สำหรับ PostgreSQL
				var cardUUID, colUUID pgtype.UUID
				if err := cardUUID.Scan(cardIDStr); err != nil {
					log.Printf("Invalid card ID: %s", cardIDStr)
					continue
				}
				if err := colUUID.Scan(newColumnIDStr); err != nil {
					log.Printf("Invalid column ID: %s", newColumnIDStr)
					continue
				}

				// 3. สั่ง Update ลง Database ผ่าน queries ที่อยู่ใน hub
				// ใช้ context.Background() เพื่อบอกว่าคำสั่งนี้ไม่มีวันหมดอายุ (ทำงานจนกว่าจะเสร็จ)
				err := c.hub.queries.UpdateCardColumn(context.Background(), db.UpdateCardColumnParams{
					ColumnID: colUUID,
					Position: position,
					ID:       cardUUID,
				})

				if err != nil {
					log.Printf("Failed to update database: %v", err)
				} else {
					log.Printf("Success: Moved Card [%s] to Column [%s] at Pos [%f]\n", cardIDStr, newColumnIDStr, position)
					// ส่งข้อความดิบ (JSON bytes) ที่รับมา โยนเข้า Channel broadcast ของ Hub
					// เพื่อให้ Hub กระจายต่อไปยัง Client ทุกคนที่เชื่อมต่ออยู่
					c.hub.broadcast <- BroadcastMessage{
						BoardID: c.boardID,
						Message: message, // หรือ msgBytes สำหรับ CARD_CREATED
					}
				}
			} else {
				log.Println("Invalid payload data for CARD_MOVED")
			}

		case "CARD_CREATED":
			// 1. แกะ Payload ที่ส่งมาจาก Frontend
			columnIDStr, ok1 := wsMsg.Payload["column_id"].(string)
			title, ok2 := wsMsg.Payload["title"].(string)

			if ok1 && ok2 {
				var colUUID pgtype.UUID
				colUUID.Scan(columnIDStr)

				// 2. บันทึกลง Database (ใช้คำสั่ง CreateCard ที่เราเตรียมไว้)
				newCard, err := c.hub.queries.CreateCard(context.Background(), db.CreateCardParams{
					ColumnID: colUUID,
					Title:    title,
					Position: 0, // หรือคำนวณตำแหน่งจริง
				})

				if err == nil {
					// 3. ปั้นข้อมูลใหม่เพื่อส่งกลับไปให้ทุกคน (รวมถึงคนสร้างด้วย)
					// เราจะส่ง Object การ์ดที่สมบูรณ์ (มี ID จาก DB) กลับไป
					broadcastMsg := WSMessage{
						Type: "CARD_CREATED",
						Payload: map[string]interface{}{
							"id":        newCard.ID.String(),
							"column_id": newCard.ColumnID.String(),
							"title":     newCard.Title,
							"position":  newCard.Position,
						},
					}

					// แปลงเป็น JSON แล้วกระจายข่าว!
					msgBytes, _ := json.Marshal(broadcastMsg)
					c.hub.broadcast <- BroadcastMessage{
                BoardID: c.boardID,  // ใช้ ID ของบอร์ดที่ Client คนนี้เชื่อมต่ออยู่
                Message: msgBytes,   // ข้อมูล JSON ที่เราเพิ่ง Marshal มา
            }
				}
			}

		case "CARD_DELETED":
			// 1. ดึง ID การ์ดที่ต้องการลบ
			cardIDStr, ok := wsMsg.Payload["card_id"].(string)
			if ok {
				var cardUUID pgtype.UUID
				if err := cardUUID.Scan(cardIDStr); err == nil {
					// 2. สั่งลบจาก Database
					err := c.hub.queries.DeleteCard(context.Background(), cardUUID)

					if err == nil {
						log.Printf("Success: Deleted Card [%s]\n", cardIDStr)
						// 3. บรอดแคสต์บอกทุกคนว่าการ์ดใบนี้ถูกลบแล้ว ให้เอาออกจากหน้าจอซะ
						c.hub.broadcast <- BroadcastMessage{
								BoardID: c.boardID,
								Message: message, // หรือ msgBytes สำหรับ CARD_CREATED
							}
					} else {
						log.Printf("Failed to delete card: %v\n", err)
					}
				}
			} else {
				log.Println("Invalid payload data for CARD_DELETED")
			}
		default:
			log.Printf("Unknown message type: %s\n", wsMsg.Type)
		}

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
		boardID: boardID, // รับค่ามาเก็บไว้ตอนเชื่อมต่อ
	}	
	client.hub.register <- client

	// อนุญาตให้ทำงานพร้อมกันโดยไม่บล็อกกันเอง
	go client.WritePump()
	go client.ReadPump()
}
