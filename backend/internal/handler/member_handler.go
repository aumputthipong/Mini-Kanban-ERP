package handler

import (
	"encoding/json"
	"log"
	"net/http"


	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)


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

	respondJSON(w, http.StatusOK, result)
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

	respondJSON(w, http.StatusOK, result)
}