package httputil

import (
    "encoding/json"
    "net/http"
)

func RespondJSON(w http.ResponseWriter, status int, payload interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    if payload != nil {
        json.NewEncoder(w).Encode(payload)
    }
}

// ErrorResponse is the canonical shape returned for any non-2xx HTTP response.
type ErrorResponse struct {
    Error string `json:"error"`
}

func RespondError(w http.ResponseWriter, status int, message string) {
    RespondJSON(w, status, ErrorResponse{Error: message})
}