package service

import (
	"context"
	"fmt"
	

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SubtaskService struct {
	queries *db.Queries
	pool    *pgxpool.Pool
}

// NewSubtaskService คือ Constructor สำหรับสร้าง Instance ของ Service
// ตรวจสอบว่า NewSubtaskService ของคุณหน้าตาเป็นแบบนี้
func NewSubtaskService(pool *pgxpool.Pool) *SubtaskService {
	return &SubtaskService{
		queries: db.New(pool), // สร้าง queries จาก pool ที่ส่งมา
		pool:    pool,
	}
}

// โครงร่างฟังก์ชัน CreateSubtask ไว้สำหรับใส่ Business Logic ในภายหลัง
func (s *SubtaskService) CreateSubtask(ctx context.Context, arg db.CreateSubtaskParams) (db.CardSubtask, error) {
    // ลองเช็คใน db.CreateSubtaskParams ดูครับว่ามีฟิลด์ไหนที่ลืมใส่หรือเปล่า
    // เช่น ถ้าใน Schema DB ตั้งไว้ว่า is_completed NOT NULL แต่ไม่ได้ตั้ง DEFAULT false
    // เราอาจจะต้องส่งเข้าไปใน params ด้วย
    subtask, err := s.queries.CreateSubtask(ctx, arg)
    if err != nil {
        return db.CardSubtask{}, fmt.Errorf("db error: %w", err)
    }
    return subtask, nil
}

// GetSubtasksByCardID ดึงข้อมูล Subtask ทั้งหมดที่ผูกกับ Card นั้นๆ
func (s *SubtaskService) GetSubtasksByCardID(ctx context.Context, cardID string) ([]db.CardSubtask, error) {
	// หมายเหตุ: หาก sqlc ของคุณถูกตั้งค่าให้รับ parameter เป็น type อื่น เช่น pgtype.UUID 
	// คุณอาจจะต้องแปลง cardID เป็น type นั้นก่อนส่งเข้า s.queries
	subtasks, err := s.queries.GetSubtasksByCardID(ctx, cardID) // หรือส่งค่าที่แปลงแล้วตาม sqlc แจ้ง
	if err != nil {
		return nil, fmt.Errorf("get subtasks failed: %w", err)
	}

	// Best Practice: ป้องกันการส่งค่า null ไปยัง Frontend
	// หาก query ไม่เจอข้อมูล (เช่น การ์ดเพิ่งสร้างและยังไม่มี Subtask) sqlc จะคืนค่า slice ที่เป็น nil
	// การคืนค่าเป็น []db.CardSubtask{} (Empty Slice) จะทำให้ Frontend ได้รับเป็น [] แทนที่จะเป็น null ใน JSON
	if subtasks == nil {
		return []db.CardSubtask{}, nil
	}

	return subtasks, nil
}