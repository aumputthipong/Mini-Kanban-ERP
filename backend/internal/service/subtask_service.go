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

    params := db.UpdateSubtaskParams{
        ID:       subtaskID, 
        Title:    title,     
        IsDone:   isDone,    
        Position: position,  
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
	
	// ถ้า sqlc ของคุณต้องการ pgtype.UUID ก็ต้องแปลงก่อน
	// var id pgtype.UUID
	// if err := id.Scan(subtaskID); err != nil {
	// 	return fmt.Errorf("invalid subtask UUID format: %w", err)
	// }

	// เรียกใช้คำสั่ง Delete จาก Database
	// เปลี่ยนเป็น s.queries.DeleteSubtask(ctx, id) ถ้าใช้ pgtype.UUID
	err := s.queries.DeleteSubtask(ctx, subtaskID)
	if err != nil {
		return fmt.Errorf("failed to delete subtask: %w", err)
	}

	return nil
}	

// GetSubtaskByID ดึงข้อมูล Subtask ตัวเดียวตาม ID ที่ส่งมา
func (s *SubtaskService) GetSubtaskByID(ctx context.Context, subtaskID string) (db.CardSubtask, error) {
	
	// หมายเหตุ: ถ้า sqlc ของคุณตั้งค่าให้รับ pgtype.UUID ก็ต้องแปลง string เป็น pgtype.UUID ตรงนี้ก่อนนะครับ
	
	subtask, err := s.queries.GetSubtask(ctx, subtaskID)
	if err != nil {
		// Best Practice: แจ้ง error ให้ชัดเจนว่าหาไม่เจอ หรือระบบ database มีปัญหา
		return db.CardSubtask{}, fmt.Errorf("get subtask failed: %w", err)
	}

	return subtask, nil
}