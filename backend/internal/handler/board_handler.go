package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/jackc/pgx/v5/pgtype"
)

// 3. สร้าง Struct ชั่วคราว (DTO) เพื่อประกอบร่าง Column และ Card เข้าด้วยกันก่อนส่งเป็น JSON
type CardResponse struct {
	ID       string  `json:"id"`
	ColumnID string  `json:"column_id"`
	Title    string  `json:"title"`
	Position float64 `json:"position"`
}

type ColumnResponse struct {
	ID       string         `json:"id"`
	Title    string         `json:"title"`
	Position float64        `json:"position"`
	Cards    []CardResponse `json:"cards"`
}

type BoardHandler struct {
	queries     *db.Queries
	frontendURL string
}

type CreateCardRequest struct {
	ColumnID string `json:"column_id"`
	Title    string `json:"title"`
}

type BoardSummaryResponse struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}

type CreateBoardRequest struct {
	Title string `json:"title"`
}

// NewBoardHandler คือ Constructor สำหรับสร้าง BoardHandler
func NewBoardHandler(q *db.Queries, frontendURL string) *BoardHandler {
	return &BoardHandler{
		queries:     q,
		frontendURL: frontendURL,
	}
}

func (h *BoardHandler) GetBoardData(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", h.frontendURL)
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	boardIDStr := r.PathValue("boardID")

	if boardIDStr == "" {
		http.Error(w, "Board ID is required", http.StatusBadRequest)
		return
	}

	var boardUUID pgtype.UUID
	err := boardUUID.Scan(boardIDStr)
	if err != nil {
		http.Error(w, "Invalid board ID format", http.StatusBadRequest)
		return
	}

	// ใช้ h.queries ที่ถูก Inject เข้ามา
	columns, err := h.queries.GetColumnsByBoardID(r.Context(), boardUUID)
	if err != nil {
		http.Error(w, "Failed to fetch columns", http.StatusInternalServerError)
		return
	}

	var columnIDs []pgtype.UUID
	for _, col := range columns {
		columnIDs = append(columnIDs, col.ID)
	}

	cards, err := h.queries.GetCardsByColumnIDs(r.Context(), columnIDs)
	if err != nil {
		log.Printf("Error fetching cards: %v", err)
	}

	result := make([]ColumnResponse, 0)
	for _, col := range columns {
		colRes := ColumnResponse{
			ID:       col.ID.String(),
			Title:    col.Title,
			Position: col.Position,
			Cards:    []CardResponse{},
		}

		for _, card := range cards {
			if card.ColumnID == col.ID {
				colRes.Cards = append(colRes.Cards, CardResponse{
					ID:       card.ID.String(),
					ColumnID: card.ColumnID.String(),
					Title:    card.Title,
					Position: card.Position,
				})
			}
		}
		result = append(result, colRes)
	}

	json.NewEncoder(w).Encode(result)
}

func (h *BoardHandler) CreateCard(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", h.frontendURL)
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	// จัดการ Preflight Request ของ Browser
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateCardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var colUUID pgtype.UUID
	if err := colUUID.Scan(req.ColumnID); err != nil {
		http.Error(w, "Invalid column ID", http.StatusBadRequest)
		return
	}

	// สร้างการ์ดใหม่ใน Database (กำหนด position เป็น 0 หรือค่าเริ่มต้นไปก่อน)
	card, err := h.queries.CreateCard(r.Context(), db.CreateCardParams{
		ColumnID: colUUID,
		Title:    req.Title,
		Position: 0, // ในระบบจริงควรคำนวณหาตำแหน่งสุดท้ายของคอลัมน์
	})

	if err != nil {
		log.Printf("Error creating card: %v", err)
		http.Error(w, "Failed to create card", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(card)
}

func (h *BoardHandler) GetAllBoards(w http.ResponseWriter, r *http.Request) {
	// ตั้งค่า CORS
	w.Header().Set("Access-Control-Allow-Origin", h.frontendURL)
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// เรียกใช้คำสั่งดึงข้อมูลจาก Database
	boards, err := h.queries.GetAllBoards(r.Context())
	if err != nil {
		log.Printf("Error fetching boards: %v", err)
		http.Error(w, "Failed to fetch boards", http.StatusInternalServerError)
		return
	}

	// แมปข้อมูลใส่ DTO เพื่อให้ JSON เป็นตัวพิมพ์เล็ก (camelCase)
	var result []BoardSummaryResponse
	for _, b := range boards {
		result = append(result, BoardSummaryResponse{
			ID:    b.ID.String(),
			Title: b.Title,
		})
	}

	json.NewEncoder(w).Encode(result)
}

func (h *BoardHandler) CreateBoard(w http.ResponseWriter, r *http.Request) {
	// 1. อ่านข้อมูล JSON ที่ Frontend ส่งมา (ชื่อโปรเจกต์)
	var req CreateBoardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	// 2. สั่งสร้าง Board ใหม่ใน Database
	board, err := h.queries.CreateBoard(ctx, req.Title)

	if err != nil {
		log.Printf("Error creating board: %v", err)
		http.Error(w, "Failed to create board", http.StatusInternalServerError)
		return
	}

	// 3. สร้างคอลัมน์มาตรฐาน (To Do, In Progress, Done) ให้บอร์ดนี้ทันที
	// [จุดที่แก้ที่ 2]: ยกเลิกการเรียก SQL ยาวๆ แล้วใช้ท่า Loop ใน Go แทน (Best Practice เพื่อให้แก้ไขง่ายในอนาคต)
	defaultColumns := []struct {
		Title    string
		Position float64 // ชนิดข้อมูลต้องตรงกับตาราง columns ใน Database (ปกติใช้ float64 สำหรับระบบลากวาง)
	}{
		{"To Do", 1.0},
		{"In Progress", 2.0},
		{"Done", 3.0},
	}

	for _, col := range defaultColumns {
		// [จุดที่แก้ที่ 3]: เรียกใช้ CreateColumn ทีละรอบ และใช้ _, err เพื่อรับค่า เพราะเราไม่ได้นำข้อมูลคอลัมน์ไปใช้ต่อ
		_, err := h.queries.CreateColumn(ctx, db.CreateColumnParams{
			BoardID:  board.ID,
			Title:    col.Title,
			Position: col.Position,
		})
		if err != nil {
			// ถ้าสร้างคอลัมน์พลาด เราแค่ Log ไว้ แต่ระบบจะไม่พังและไปต่อได้ (Graceful Degradation)
			log.Printf("Warning: Failed to create default column %s for board %s: %v", col.Title, board.ID.String(), err)
		}
	}

	// 4. ส่ง ID ของบอร์ดที่เพิ่งสร้างเสร็จกลับไปให้ Frontend เพื่อให้ Redirect
	w.Header().Set("Content-Type", "application/json") // ควรระบุ Content-Type เสมอเมื่อส่งกลับเป็น JSON
	json.NewEncoder(w).Encode(map[string]string{
		"id": board.ID.String(),
	})
}

func (h *BoardHandler) HandleBoardsRoute(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", h.frontendURL)
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	switch r.Method {
	case http.MethodGet:
		h.GetAllBoards(w, r) // ไปฟังก์ชันเดิมที่เขียนไว้
	case http.MethodPost:
		h.CreateBoard(w, r) // ไปฟังก์ชันใหม่ที่เราเพิ่งเขียน
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}
