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
	stop       chan struct{}
	boardCmd   *service.BoardCommandService
	activities *service.ActivityService
	// allowedOrigin is the single trusted browser origin (FRONTEND_URL).
	// Empty string disables origin checking — only acceptable in tests.
	allowedOrigin string
}

type BroadcastMessage struct {
	BoardID string
	Message []byte
}

func NewHub(boardCmd *service.BoardCommandService, activities *service.ActivityService, allowedOrigin string) *Hub {
	return &Hub{
		rooms:         make(map[string]map[*Client]bool),
		broadcast:     make(chan BroadcastMessage),
		register:      make(chan *Client),
		unregister:    make(chan *Client),
		stop:          make(chan struct{}),
		boardCmd:      boardCmd,
		activities:    activities,
		allowedOrigin: allowedOrigin,
	}
}

// Shutdown closes every active WS connection and stops the hub goroutine.
// Idempotent — safe to call once at SIGTERM. Pumps observe a closed `send`
// channel and exit; ReadPump returns when the underlying conn closes.
func (h *Hub) Shutdown() {
	select {
	case <-h.stop:
		// already stopped
	default:
		close(h.stop)
	}
}

func (h *Hub) Run() {
	for {
		select {
		case <-h.stop:
			for boardID, clients := range h.rooms {
				for client := range clients {
					close(client.send)
					_ = client.conn.Close()
				}
				delete(h.rooms, boardID)
			}
			return
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