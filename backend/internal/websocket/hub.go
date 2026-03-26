package websocket

import (
		"log"
		"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
)

type Hub struct {
	clients map[*Client]bool


	broadcast chan []byte

	register chan *Client

	unregister chan *Client

	queries *db.Queries
}

// NewHub สร้าง instance ใหม่ของ Hub
func NewHub(queries *db.Queries) *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		queries:    queries,
	}
}

// Run เริ่มต้นการทำงานของ Hub (ควรเรียกใช้ผ่าน Goroutine)
func (h *Hub) Run() {
	for {
		// select ใช้สำหรับรอรับข้อมูลจากหลายๆ Channel พร้อมกัน
		select {
		case client := <-h.register:
			h.clients[client] = true
			log.Println("New client connected. Total clients:", len(h.clients))

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				log.Println("Client disconnected. Total clients:", len(h.clients))
			}

		case message := <-h.broadcast:
			// กระจายข้อความให้ทุก Client ที่ออนไลน์อยู่
			for client := range h.clients {
				select {
				case client.send <- message:
					// ส่งสำเร็จ
				default:
					// ถ้าส่งไม่ผ่าน (เช่น ท่อเต็ม หรือค้าง) ให้ตัดการเชื่อมต่อเพื่อรักษาทรัพยากร
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}