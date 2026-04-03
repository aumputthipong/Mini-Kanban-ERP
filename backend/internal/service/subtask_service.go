package service

import (
	"context"
	"fmt"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/dto"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SubtaskService struct {
	queries *db.Queries
	pool    *pgxpool.Pool
}

func NewSubtaskService(pool *pgxpool.Pool) *SubtaskService {
	return &SubtaskService{
		queries: db.New(pool), // สร้าง queries จาก pool ที่ส่งมา
		pool:    pool,
	}
}

func (s *SubtaskService) CreateSubtask(ctx context.Context, arg db.CreateSubtaskParams) (db.CardSubtask, error) {

    subtask, err := s.queries.CreateSubtask(ctx, arg)
    if err != nil {
        return db.CardSubtask{}, fmt.Errorf("db error: %w", err)
    }
    return subtask, nil
}

func (s *SubtaskService) GetSubtasksByCardID(ctx context.Context, cardID string) ([]db.CardSubtask, error) {

	subtasks, err := s.queries.GetSubtasksByCardID(ctx, cardID) // หรือส่งค่าที่แปลงแล้วตาม sqlc แจ้ง
	if err != nil {
		return nil, fmt.Errorf("get subtasks failed: %w", err)
	}
	if subtasks == nil {
		return []db.CardSubtask{}, nil
	}

	return subtasks, nil
}
func (s *SubtaskService) UpdateSubtask(ctx context.Context, subtaskID string, req dto.UpdateSubtaskRequest) (db.CardSubtask, error) {
    
    // 1. Fetch: ดึงข้อมูล Subtask เดิมจากฐานข้อมูลมาก่อน
    existing, err := s.queries.GetSubtask(ctx, subtaskID)
    if err != nil {
        return db.CardSubtask{}, fmt.Errorf("subtask not found: %w", err)
    }

    // 2. Merge: ถ้ายูสเซอร์ส่งอะไรมา ก็เอาไปทับของเดิม
    title := existing.Title
    if req.Title != nil {
        title = *req.Title
    }

    isDone := existing.IsDone
    if req.IsDone != nil {
        isDone = *req.IsDone
    }

    position := existing.Position
    if req.Position != nil {
        position = *req.Position
    }

    // 3. Save: เตรียมข้อมูลเซฟกลับ (ตอนนี้ Type ตรงกับที่ sqlc ต้องการเป๊ะๆ)
    params := db.UpdateSubtaskParams{
        ID:       subtaskID, // ส่ง string ตรงๆ ได้เลย!
        Title:    title,     // ส่ง string ตรงๆ
        IsDone:   isDone,    // ส่ง bool ตรงๆ
        Position: position,  // ส่ง float64 ตรงๆ
    }

    // เซฟลงฐานข้อมูล
    updatedSubtask, err := s.queries.UpdateSubtask(ctx, params)
    if err != nil {
        return db.CardSubtask{}, fmt.Errorf("failed to update subtask in db: %w", err)
    }

    return updatedSubtask, nil
}
// DeleteSubtask ลบข้อมูลออกจากฐานข้อมูล
func (s *SubtaskService) DeleteSubtask(ctx context.Context, subtaskID string) error {
	err := s.queries.DeleteSubtask(ctx, subtaskID)
	if err != nil {
		return fmt.Errorf("failed to delete subtask: %w", err)
	}
	return nil
}