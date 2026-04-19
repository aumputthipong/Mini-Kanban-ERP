// internal/websocket/dispatcher.go
//
// รับผิดชอบการ route WebSocket message ไปยัง handler ที่ถูกต้องตาม type.
// แยกออกจาก client.go (connection management) เพื่อให้แต่ละไฟล์มี responsibility เดียว
package websocket

import "log"

// WSMessage คือ envelope มาตรฐานของทุก message ระหว่าง client <-> server
type WSMessage struct {
	Type    string                 `json:"type"`
	Payload map[string]interface{} `json:"payload"`
}

// dispatch route ข้อความที่เข้ามาไปยัง handler ของ domain ที่สอดคล้องกัน
func (c *Client) dispatch(wsMsg WSMessage, rawMsg []byte) {
	switch wsMsg.Type {
	case "CARD_MOVED":
		c.handleCardMoved(wsMsg.Payload, rawMsg)
	case "CARD_CREATED":
		c.handleCardCreated(wsMsg.Payload)
	case "CARD_DELETED":
		c.handleCardDeleted(wsMsg.Payload, rawMsg)
	case "CARD_UPDATED":
		c.handleCardUpdated(wsMsg.Payload, rawMsg)
	case "CARD_DONE_TOGGLED":
		c.handleCardDoneToggled(wsMsg.Payload)
	case "COLUMN_CREATED":
		c.handleColumnCreated(wsMsg.Payload)
	case "COLUMN_RENAMED":
		c.handleColumnRenamed(wsMsg.Payload)
	case "COLUMN_DELETED":
		c.handleColumnDeleted(wsMsg.Payload)
	case "COLUMN_UPDATED":
		c.handleColumnUpdated(wsMsg.Payload)
	default:
		log.Printf("Unknown message type: %s", wsMsg.Type)
	}
}
