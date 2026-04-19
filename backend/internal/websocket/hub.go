package websocket

import (
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
)

// Hub จัดการ client connections แยกเป็น room ตาม board ID.
// Hub delegate write operations ให้ BoardCommandService — ไม่ถือ *db.Queries โดยตรง
type Hub struct {
	rooms map[string]map[*Client]bool

	broadcast  chan BroadcastMessage
	register   chan *Client
	unregister chan *Client
	boardCmd   *service.BoardCommandService
	activities *service.ActivityService
}

type BroadcastMessage struct {
	BoardID string
	Message []byte
}

func NewHub(boardCmd *service.BoardCommandService, activities *service.ActivityService) *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]bool),
		broadcast:  make(chan BroadcastMessage),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		boardCmd:   boardCmd,
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