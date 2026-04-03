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