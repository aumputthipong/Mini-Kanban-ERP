package handler

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/pgutil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func NewBoardHandler(boardService *service.BoardService) *BoardHandler {
	return &BoardHandler{
		boardService: boardService,
	}
}

func (h *BoardHandler) GetBoardData(w http.ResponseWriter, r *http.Request) {

	boardIDStr := chi.URLParam(r, "boardID")
	if boardIDStr == "" {
		http.Error(w, "Board ID is required", http.StatusBadRequest)
		return
	}

	var boardUUID uuid.UUID
	if err := boardUUID.Scan(boardIDStr); err != nil {
		http.Error(w, "Invalid board ID format", http.StatusBadRequest)
		return
	}

	columns, err := h.boardService.GetBoardWithCards(r.Context(), boardUUID)
	if err != nil {
		log.Printf("GetBoardWithCards error: %v", err)
		http.Error(w, "Failed to fetch board data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(toColumnResponses(columns))
}

func toColumnResponses(columns []service.ColumnData) []ColumnResponse {
	result := make([]ColumnResponse, 0, len(columns))
	for _, col := range columns {
		cards := make([]CardResponse, 0, len(col.Cards))
		for _, card := range col.Cards {
			cards = append(cards, CardResponse{
				ID:           card.ID.String(),
				ColumnID:     card.ColumnID.String(),
				Title:        card.Title,
				Description:  pgutil.TextToPtr(card.Description),
				Position:     card.Position,
				DueDate:      pgutil.DateToPtr(card.DueDate),
				AssigneeID:   pgutil.UUIDToPtr(card.AssigneeID),
				AssigneeName: pgutil.TextToPtr(card.AssigneeName),
				Priority:     pgutil.TextToPtr(card.Priority),
			})
		}
		result = append(result, ColumnResponse{
			ID:       col.ID.String(),
			Title:    col.Title,
			Position: col.Position,
			Cards:    cards,
		})
	}
	return result
}

func (h *BoardHandler) CreateCard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateCardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	colUUID, err := uuid.Parse(req.ColumnID)
	if err := colUUID.Scan(req.ColumnID); err != nil {
		http.Error(w, "Invalid column ID", http.StatusBadRequest)
		return
	}

	card, err := h.boardService.CreateCard(r.Context(), db.CreateCardParams{
		ColumnID: colUUID,
		Title:    req.Title,
		Position: 0,
		DueDate:  pgutil.PtrToDate(req.DueDate),
		// AssigneeID ใช้ pgutil.PtrToUUID ถ้ามี helper นั้น
		Priority: pgutil.PtrToText(req.Priority),
	})
	if err != nil {
		log.Printf("Error creating card: %v", err)
		http.Error(w, "Failed to create card", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(card)
}

func (h *BoardHandler) GetAllBoards(w http.ResponseWriter, r *http.Request) {

	boards, err := h.boardService.GetAllBoards(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch boards", http.StatusInternalServerError)
		return
	}

	result := make([]BoardSummaryResponse, 0, len(boards))
	for _, b := range boards {
		result = append(result, BoardSummaryResponse{
			ID:    b.ID.String(),
			Title: b.Title,
		})
	}
	json.NewEncoder(w).Encode(result)
}

func (h *BoardHandler) CreateBoard(w http.ResponseWriter, r *http.Request) {
	var req CreateBoardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// ดึง userID จาก context ที่ RequireAuth inject ไว้
	userIDStr, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userIDStr == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var ownerUUID uuid.UUID
	if err := ownerUUID.Scan(userIDStr); err != nil {
		http.Error(w, "Invalid user ID in token", http.StatusInternalServerError)
		return
	}

	boardID, err := h.boardService.CreateBoard(r.Context(), req.Title, ownerUUID)
	if err != nil {
		http.Error(w, "Failed to create board", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{"id": boardID.String()})
}
func (h *BoardHandler) HandleBoardsRoute(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.GetAllBoards(w, r)
	case http.MethodPost:
		h.CreateBoard(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *BoardHandler) MoveToTrash(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	boardIDStr := chi.URLParam(r, "boardID")
	if boardIDStr == "" {
		http.Error(w, "Board ID is required", http.StatusBadRequest)
		return
	}

	var boardUUID uuid.UUID
	if err := boardUUID.Scan(boardIDStr); err != nil {
		http.Error(w, "Invalid board ID format", http.StatusBadRequest)
		return
	}

	if err := h.boardService.MoveBoardToTrash(r.Context(), boardUUID); err != nil {
		http.Error(w, "Failed to move board to trash", http.StatusInternalServerError)
		return
	}

	// ส่ง Status 204 No Content เพื่อบอกว่าลบสำเร็จและไม่มีข้อมูลอะไรต้องส่งกลับ
	w.WriteHeader(http.StatusNoContent)
}

// ดึงรายการในถังขยะ
func (h *BoardHandler) GetTrash(w http.ResponseWriter, r *http.Request) {

	boards, err := h.boardService.GetTrashedBoards(r.Context())
	if err != nil {
		http.Error(w, "Failed to get trash", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(boards); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// ลบถาวร
func (h *BoardHandler) HardDelete(w http.ResponseWriter, r *http.Request) {
	boardIDStr := chi.URLParam(r, "boardID")
	var boardUUID uuid.UUID
	boardUUID.Scan(boardIDStr)

	if err := h.boardService.HardDeleteBoard(r.Context(), boardUUID); err != nil {
		http.Error(w, "Delete failed", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *BoardHandler) UpdateBoard(w http.ResponseWriter, r *http.Request) {
	boardUUID, err := getUUIDParam(r, "boardID")
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid or missing board ID")
		return
	}

	var req UpdateBoardRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	updatedBoard, err := h.boardService.UpdateBoard(r.Context(), boardUUID, req.Title, req.Budget)
	if err != nil {
		// [ข้อควรระวัง] ควร Log error จริงไว้ดูด้วย
		log.Printf("Failed to update board: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to update board")
		return
	}

	respondJSON(w, http.StatusOK, updatedBoard)
}

func (h *BoardHandler) UpdateCard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cardIDStr := r.PathValue("cardID")
	if cardIDStr == "" {
		http.Error(w, "Card ID is required", http.StatusBadRequest)
		return
	}

	var cardUUID uuid.UUID
	if err := cardUUID.Scan(cardIDStr); err != nil {
		http.Error(w, "Invalid card ID format", http.StatusBadRequest)
		return
	}

	var req UpdateCardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var estimatedHours pgtype.Numeric
	if req.EstimatedHours != nil {
		estimatedHours.Scan(fmt.Sprintf("%f", *req.EstimatedHours))
	}

	card, err := h.boardService.UpdateCard(r.Context(), service.UpdateCardParams{
		ID:             cardUUID,
		Title:          pgutil.PtrToText(req.Title),
		Description:    pgutil.PtrToText(req.Description),
		DueDate:        pgutil.PtrToDate(req.DueDate),
		AssigneeID:     pgutil.PtrToUUID(req.AssigneeID),
		Priority:       pgutil.PtrToText(req.Priority),
		EstimatedHours: estimatedHours,
	})
	if err != nil {
		log.Printf("UpdateCard error: %v", err)
		http.Error(w, "Failed to update card", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, card)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("writeJSON encode error: %v", err)
	}
}

func (h *BoardHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.boardService.GetAllUsers(r.Context())
	if err != nil {
		log.Printf("GetAllUsers error: %v", err)
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return
	}

	result := make([]UserResponse, 0, len(users))
	for _, u := range users {
		result = append(result, UserResponse{
			ID:       u.ID.String(),
			Email:    u.Email,
			FullName: u.FullName,
		})
	}

	writeJSON(w, http.StatusOK, result)
}

func (h *BoardHandler) GetBoardMembers(w http.ResponseWriter, r *http.Request) {
	boardIDStr := chi.URLParam(r, "boardID")
	var boardUUID uuid.UUID
	if err := boardUUID.Scan(boardIDStr); err != nil {
		http.Error(w, "Invalid board ID", http.StatusBadRequest)
		return
	}

	members, err := h.boardService.GetBoardMembers(r.Context(), boardUUID)
	if err != nil {
		log.Printf("GetBoardMembers error: %v", err)
		http.Error(w, "Failed to fetch members", http.StatusInternalServerError)
		return
	}

	result := make([]BoardMemberResponse, 0, len(members))
	for _, m := range members {
		result = append(result, BoardMemberResponse{
			ID:       m.ID.String(),
			Role:     m.Role,
			UserID:   m.UserID.String(),
			Email:    m.Email,
			FullName: m.FullName,
		})
	}

	writeJSON(w, http.StatusOK, result)
}

func (h *BoardHandler) AddBoardMember(w http.ResponseWriter, r *http.Request) {
	boardIDStr := chi.URLParam(r, "boardID")
	var boardUUID uuid.UUID
	if err := boardUUID.Scan(boardIDStr); err != nil {
		http.Error(w, "Invalid board ID", http.StatusBadRequest)
		return
	}

	var req AddMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	validRoles := map[string]bool{"owner": true, "manager": true, "member": true}
	if !validRoles[req.Role] {
		http.Error(w, "Invalid role", http.StatusBadRequest)
		return
	}

	var userUUID uuid.UUID
	if err := userUUID.Scan(req.UserID); err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	if err := h.boardService.AddBoardMember(r.Context(), boardUUID, userUUID, req.Role); err != nil {
		log.Printf("AddBoardMember error: %v", err)
		http.Error(w, "Failed to add member", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (h *BoardHandler) RemoveBoardMember(w http.ResponseWriter, r *http.Request) {
	boardIDStr := chi.URLParam(r, "boardID")
	userIDStr := chi.URLParam(r, "userID")

	var boardUUID, userUUID uuid.UUID
	if err := boardUUID.Scan(boardIDStr); err != nil {
		http.Error(w, "Invalid board ID", http.StatusBadRequest)
		return
	}
	if err := userUUID.Scan(userIDStr); err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	if err := h.boardService.RemoveBoardMember(r.Context(), boardUUID, userUUID); err != nil {
		log.Printf("RemoveBoardMember error: %v", err)
		http.Error(w, "Failed to remove member", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *BoardHandler) UpdateMemberRole(w http.ResponseWriter, r *http.Request) {
	boardIDStr := chi.URLParam(r, "boardID")
	userIDStr := chi.URLParam(r, "userID")

	var boardUUID, userUUID uuid.UUID
	if err := boardUUID.Scan(boardIDStr); err != nil {
		http.Error(w, "Invalid board ID", http.StatusBadRequest)
		return
	}
	if err := userUUID.Scan(userIDStr); err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	var req UpdateMemberRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	validRoles := map[string]bool{"manager": true, "member": true}
	if !validRoles[req.Role] {
		http.Error(w, "Invalid role — cannot change to owner", http.StatusBadRequest)
		return
	}

	if err := h.boardService.UpdateMemberRole(r.Context(), boardUUID, userUUID, req.Role); err != nil {
		log.Printf("UpdateMemberRole error: %v", err)
		http.Error(w, "Failed to update role", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *BoardHandler) GetCard(w http.ResponseWriter, r *http.Request) {
	// 1. อ่านค่า cardID จาก URL
	cardIDStr := chi.URLParam(r, "cardID")

	// 2. แปลง String เป็น UUID (Best Practice: ตรวจสอบ Format ก่อนไปตี Database)
	cardID, err := uuid.Parse(cardIDStr)
	if err != nil {
		http.Error(w, "Invalid card ID format", http.StatusBadRequest)
		return
	}

	// 3. เรียกใช้ Service เพื่อดึงข้อมูล (ส่ง context ไปด้วยเสมอ)
	card, err := h.boardService.GetCard(r.Context(), cardID)
	if err != nil {
		// Best Practice: แยกประเภทของ Error เพื่อส่ง HTTP Status ให้ถูกต้อง
		if errors.Is(err, sql.ErrNoRows) {
			// ถ้าหาไม่เจอ ให้ส่ง 404 Not Found
			http.Error(w, "Card not found", http.StatusNotFound)
			return
		}
		// ถ้าเป็น Error อื่นๆ จากระบบ ให้ส่ง 500
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// 4. ตั้งค่า Header ว่าข้อมูลที่จะส่งกลับไปเป็น JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	// 5. แปลง Struct card เป็น JSON แล้วส่งกลับ
	if err := json.NewEncoder(w).Encode(card); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}
