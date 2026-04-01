package handler

import (
	"encoding/json"
	"log"
	"net/http"


	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func (h *BoardHandler) GetBoardMembers(w http.ResponseWriter, r *http.Request) error{
	boardIDStr := chi.URLParam(r, "boardID")
	var boardUUID uuid.UUID
	if err := boardUUID.Scan(boardIDStr); err != nil {
		return NewAPIError(http.StatusBadRequest, "Invalid board ID", err)
	}

	members, err := h.boardService.GetBoardMembers(r.Context(), boardUUID)
	if err != nil {
		log.Printf("GetBoardMembers error: %v", err)
		return NewAPIError(http.StatusInternalServerError, "Failed to fetch members", err)
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
	return nil
}

func (h *BoardHandler) AddBoardMember(w http.ResponseWriter, r *http.Request) error {
	boardIDStr := chi.URLParam(r, "boardID")
	var boardUUID uuid.UUID
	if err := boardUUID.Scan(boardIDStr); err != nil {
		return NewAPIError(http.StatusBadRequest, "Invalid board ID", err)
	}

	var req AddMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return NewAPIError(http.StatusBadRequest, "Invalid request body", err)
	}

	validRoles := map[string]bool{"owner": true, "manager": true, "member": true}
	if !validRoles[req.Role] {
		return NewAPIError(http.StatusBadRequest, "Invalid role", nil)
	}

	var userUUID uuid.UUID
	if err := userUUID.Scan(req.UserID); err != nil {
		return NewAPIError(http.StatusBadRequest, "Invalid user ID", err)
	}

	if err := h.boardService.AddBoardMember(r.Context(), boardUUID, userUUID, req.Role); err != nil {
		return NewAPIError(http.StatusInternalServerError, "Failed to add member", err)
	}

	w.WriteHeader(http.StatusCreated)
	return nil
}

func (h *BoardHandler) RemoveBoardMember(w http.ResponseWriter, r *http.Request) error{
	boardIDStr := chi.URLParam(r, "boardID")
	userIDStr := chi.URLParam(r, "userID")

	var boardUUID, userUUID uuid.UUID
	if err := boardUUID.Scan(boardIDStr); err != nil {
		return NewAPIError(http.StatusBadRequest, "Invalid board ID", err)
	}
	if err := userUUID.Scan(userIDStr); err != nil {
		return NewAPIError(http.StatusBadRequest, "Invalid user ID", err)
	}

	if err := h.boardService.RemoveBoardMember(r.Context(), boardUUID, userUUID); err != nil {
		return NewAPIError(http.StatusInternalServerError, "Failed to remove member", err)
	}

	w.WriteHeader(http.StatusNoContent)
	return nil
}

func (h *BoardHandler) UpdateMemberRole(w http.ResponseWriter, r *http.Request) error {
	boardIDStr := chi.URLParam(r, "boardID")
	userIDStr := chi.URLParam(r, "userID")

	var boardUUID, userUUID uuid.UUID
	if err := boardUUID.Scan(boardIDStr); err != nil {
		return NewAPIError(http.StatusBadRequest, "Invalid board ID", err)
	}
	if err := userUUID.Scan(userIDStr); err != nil {
		return NewAPIError(http.StatusBadRequest, "Invalid user ID", err)
	}

	var req UpdateMemberRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return NewAPIError(http.StatusBadRequest, "Invalid request body", err)
	}

	validRoles := map[string]bool{"manager": true, "member": true}
	if !validRoles[req.Role] {
		return NewAPIError(http.StatusBadRequest, "Invalid role — cannot change to owner", nil)
	}

	if err := h.boardService.UpdateMemberRole(r.Context(), boardUUID, userUUID, req.Role); err != nil {
		return NewAPIError(http.StatusInternalServerError, "Failed to update role", err)
	}

	w.WriteHeader(http.StatusNoContent)
	return nil
}

func (h *BoardHandler) GetAllUsers(w http.ResponseWriter, r *http.Request)error {
	users, err := h.boardService.GetAllUsers(r.Context())
	if err != nil {
		log.Printf("GetAllUsers error: %v", err)
		return NewAPIError(http.StatusInternalServerError, "Failed to fetch users", err)
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
	return nil
}