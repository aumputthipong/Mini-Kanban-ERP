package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func getUUIDParam(r *http.Request, key string) (uuid.UUID, error) {
    paramStr := chi.URLParam(r, key)
    if paramStr == "" {
        return uuid.Nil, errors.New("missing parameter")
    }
    return uuid.Parse(paramStr)
}

// Helper: อ่าน JSON Body
func decodeJSON(r *http.Request, v interface{}) error {
    return json.NewDecoder(r.Body).Decode(v)
}

// Helper: ส่ง JSON Response
func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    if payload != nil {
        json.NewEncoder(w).Encode(payload)
    }
}

// Helper: ส่ง Error Response
func respondError(w http.ResponseWriter, status int, message string) {
    respondJSON(w, status, map[string]string{"error": message})
}