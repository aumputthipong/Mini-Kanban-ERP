package websocket

import (
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
)

// Hub ทำหน้าที่จัดการ Client และแยกห้องตาม Board ID
type Hub struct {
	// เปลี่ยนจาก clients map[*Client]bool
	// เป็น rooms โดยใช้ boardID (string) เป็น Key และ Value คือ map ของ Client
	rooms map[string]map[*Client]bool

	broadcast  chan BroadcastMessage // สร้าง Struct ใหม่เพื่อระบุว่าข้อความนี้ของห้องไหน
	register   chan *Client
	unregister chan *Client
	queries    *db.Queries
	activities *service.ActivityService
}

// สร้าง Struct สำหรับผูกข้อความเข้ากับ Board ID
type BroadcastMessage struct {
	BoardID string
	Message []byte
}

func NewHub(queries *db.Queries, activities *service.ActivityService) *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]bool), // ประกาศ Map เปล่า
		broadcast:  make(chan BroadcastMessage),       // ใช้ Channel แบบใหม่
		register:   make(chan *Client),
		unregister: make(chan *Client),
		queries:    queries,
		activities: activities,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			// เช็คว่ามีห้องสำหรับ BoardID นี้หรือยัง ถ้ายังไม่มีให้สร้างใหม่
			if _, ok := h.rooms[client.boardID]; !ok {
				h.rooms[client.boardID] = make(map[*Client]bool)
			}
			// เอา Client เข้าห้องที่ถูกต้อง
			h.rooms[client.boardID][client] = true

		case client := <-h.unregister:
			// เอา Client ออกจากห้อง
			if clients, ok := h.rooms[client.boardID]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.send)
					
					// ถ้าห้องว่างเปล่าแล้ว (ไม่มีคนดูบอร์ดนี้) ให้ลบห้องทิ้งเพื่อคืน Memory (Best Practice)
					if len(clients) == 0 {
						delete(h.rooms, client.boardID)
					}
				}
			}

		case broadcastMsg := <-h.broadcast:
			// ดึงรายชื่อ Client เฉพาะคนที่อยู่ใน BoardID นี้
			if clients, ok := h.rooms[broadcastMsg.BoardID]; ok {
				for client := range clients {
					select {
					case client.send <- broadcastMsg.Message:
					default:
						// ถ้าส่งไม่ได้ (เช่น เน็ตหลุด) ให้เตะออกจากห้อง
						close(client.send)
						delete(clients, client)
					}
				}
			}
		}
	}
}