package handler

import (
	"encoding/json"
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/core"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/dto"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func (h *BoardHandler) GetBoardMembers(w http.ResponseWriter, r *http.Request) error {
	boardID, err := httputil.GetUUIDParam(r, "boardID")
	if err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid board ID", err)
	}

	members, err := h.boardService.GetBoardMembers(r.Context(), boardID)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to fetch members", err)
	}

	result := make([]dto.BoardMemberResponse, 0, len(members))
	for _, m := range members {
		result = append(result, dto.BoardMemberResponse{
			ID:       m.ID,
			Role:     m.Role,
			UserID:   m.UserID,
			Email:    m.Email,
			FullName: m.FullName,
		})
	}

	httputil.RespondJSON(w, http.StatusOK, result)
	return nil
}

func (h *BoardHandler) AddBoardMember(w http.ResponseWriter, r *http.Request) error {
	boardID, err := httputil.GetUUIDParam(r, "boardID")
	if err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid board ID", err)
	}

	var req dto.AddMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid request body", err)
	}

	if !core.BoardRole(req.Role).IsValid() {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid role", nil)
	}

	// validate UUID format ของ userID
	if _, err := uuid.Parse(req.UserID); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid user ID", err)
	}

	if err := h.boardService.AddBoardMember(r.Context(), boardID, req.UserID, req.Role); err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to add member", err)
	}

	w.WriteHeader(http.StatusCreated)
	return nil
}

func (h *BoardHandler) RemoveBoardMember(w http.ResponseWriter, r *http.Request) error {
	boardID, err := httputil.GetUUIDParam(r, "boardID")
	if err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid board ID", err)
	}

	userIDStr := chi.URLParam(r, "userID")
	if _, err := uuid.Parse(userIDStr); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid user ID", err)
	}

	if err := h.boardService.RemoveBoardMember(r.Context(), boardID, userIDStr); err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to remove member", err)
	}

	w.WriteHeader(http.StatusNoContent)
	return nil
}

func (h *BoardHandler) UpdateMemberRole(w http.ResponseWriter, r *http.Request) error {
	boardID, err := httputil.GetUUIDParam(r, "boardID")
	if err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid board ID", err)
	}

	userIDStr := chi.URLParam(r, "userID")
	if _, err := uuid.Parse(userIDStr); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid user ID", err)
	}

	var req dto.UpdateMemberRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid request body", err)
	}

	role := core.BoardRole(req.Role)
	if !role.IsValid() || role == core.RoleOwner {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid role — cannot change to owner", nil)
	}

	if err := h.boardService.UpdateMemberRole(r.Context(), boardID, userIDStr, req.Role); err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to update role", err)
	}

	w.WriteHeader(http.StatusNoContent)
	return nil
}

func (h *BoardHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) error {
	users, err := h.boardService.GetAllUsers(r.Context())
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to fetch users", err)
	}

	result := make([]dto.UserResponse, 0, len(users))
	for _, u := range users {
		result = append(result, dto.UserResponse{
			ID:       u.ID,
			Email:    u.Email,
			FullName: u.FullName,
		})
	}

	httputil.RespondJSON(w, http.StatusOK, result)
	return nil
}
