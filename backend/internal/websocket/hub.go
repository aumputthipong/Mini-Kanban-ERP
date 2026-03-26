package websocket

import "log"

// Hub จัดการรายชื่อ Client ทั้งหมดและรับส่งข้อความระหว่างกัน
type Hub struct {
	// เก็บรายชื่อ Client ที่ออนไลน์อยู่
	// การใช้ map ช่วยให้ค้นหาและลบข้อมูลได้เร็ว (O(1) Time Complexity)
	clients map[*Client]bool

	// ท่อ (Channel) สำหรับรับข้อความที่ต้องการกระจายให้ทุกคน
	broadcast chan []byte

	// ท่อสำหรับลงทะเบียน Client เข้ามาใหม่
	register chan *Client

	// ท่อสำหรับถอด Client ออกเมื่อตัดการเชื่อมต่อ
	unregister chan *Client
}

// NewHub สร้าง instance ใหม่ของ Hub
func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
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