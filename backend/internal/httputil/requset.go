package httputil

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func DecodeJSON(r *http.Request, v interface{}) error {
	return json.NewDecoder(r.Body).Decode(v)
}

// GetUUIDParam ตรวจสอบว่า URL param เป็น UUID ที่ valid แล้วคืนค่าเป็น string
// ใช้ uuid.Parse เพื่อ validate format แต่คืนเป็น string เพราะ sqlc ใช้ string สำหรับ ID
func GetUUIDParam(r *http.Request, key string) (string, error) {
	paramStr := chi.URLParam(r, key)
	if paramStr == "" {
		return "", errors.New("missing parameter: " + key)
	}
	if _, err := uuid.Parse(paramStr); err != nil {
		return "", errors.New("invalid UUID format for parameter: " + key)
	}
	return paramStr, nil
}
