package httputil

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// สังเกตว่าเปลี่ยนตัว D เป็นตัวพิมพ์ใหญ่
func DecodeJSON(r *http.Request, v interface{}) error {
    return json.NewDecoder(r.Body).Decode(v)
}

// สังเกตว่าเปลี่ยนตัว G เป็นตัวพิมพ์ใหญ่
func GetUUIDParam(r *http.Request, key string) (uuid.UUID, error) {
    paramStr := chi.URLParam(r, key)
    if paramStr == "" {
        return uuid.Nil, errors.New("missing parameter")
    }
    return uuid.Parse(paramStr)
}