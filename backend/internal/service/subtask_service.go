package service

import (
	"context"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SubtaskService struct {
	queries *db.Queries
	pool    *pgxpool.Pool
}

// NewSubtaskService คือ Constructor สำหรับสร้าง Instance ของ Service
func NewSubtaskService(pool *pgxpool.Pool) *SubtaskService {
	return &SubtaskService{
		queries: db.New(pool),
		pool:    pool,
	}
}

// โครงร่างฟังก์ชัน CreateSubtask ไว้สำหรับใส่ Business Logic ในภายหลัง
func (s *SubtaskService) CreateSubtask(ctx context.Context /* ใส่ parameters ที่จำเป็น */) error {
	// TODO: ใส่ Logic การบันทึก Subtask ลงฐานข้อมูล
	return nil
}