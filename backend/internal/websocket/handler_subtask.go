// internal/websocket/handler_subtask.go
//
// Handlers สำหรับ WS message ในโดเมน subtask.
// หมายเหตุ: ปัจจุบัน dispatcher.go ยังไม่ได้ route SUBTASK_UPDATE / SUBTASK_TOGGLE มายัง handler เหล่านี้
// (dead code ที่เก็บไว้เพื่อไม่เปลี่ยนพฤติกรรมระบบ) — หากต้องการเปิดใช้ ให้ route จาก dispatch()
package websocket

import (
	"context"
	"log"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
)

func (c *Client) handleSubtaskUpdate(payload map[string]interface{}, rawMsg []byte) {
	subtaskID, _ := payload["subtask_id"].(string)
	isDone, _ := payload["is_done"].(bool)
	title, _ := payload["title"].(string)
	position, _ := payload["position"].(float64)

	ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
	defer cancel()

	if err := c.hub.boardCmd.UpdateSubtaskAll(ctx, service.UpdateSubtaskWSParams{
		ID:       subtaskID,
		Title:    title,
		IsDone:   isDone,
		Position: position,
	}); err != nil {
		log.Printf("Error updating subtask [%s]: %v", subtaskID, err)
		return
	}

	c.hub.broadcast <- BroadcastMessage{BoardID: c.boardID, Message: rawMsg}
}

func (c *Client) handleSubtaskToggle(payload map[string]interface{}, rawMsg []byte) {
	subtaskID, _ := payload["subtask_id"].(string)
	isDone, _ := payload["is_done"].(bool)

	_ = c.hub.boardCmd.ToggleSubtaskDone(context.Background(), subtaskID, isDone)

	c.hub.broadcast <- BroadcastMessage{BoardID: c.boardID, Message: rawMsg}
}
