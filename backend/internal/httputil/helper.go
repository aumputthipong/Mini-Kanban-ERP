package httputil

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

)

// 1. สร้าง Custom Error Struct ที่เก็บ Status Code ไว้ในตัว
type APIError struct {
	StatusCode int
	Message    string
	Err        error // เก็บ Error จริงๆ ไว้สำหรับ Log ระบบ
}

// ฟังก์ชันสำหรับบังคับให้ APIError เป็นมาตรฐานของ Go error interface
func (e *APIError) Error() string {
	if e.Err != nil {
		return e.Message + ": " + e.Err.Error()
	}
	return e.Message
}

// ฟังก์ชันช่วยสร้าง Error ง่ายๆ
func NewAPIError(statusCode int, message string, err error) *APIError {
	return &APIError{
		StatusCode: statusCode,
		Message:    message,
		Err:        err,
	}
}

// 2. นิยาม Type ใหม่สำหรับ Handler ที่สามารถ Return Error ได้
type APIFunc func(w http.ResponseWriter, r *http.Request) error

// 3. ฟังก์ชัน Wrapper (ตัวครอบ) ที่จะจัดการ Error ทั้งหมดแบบรวมศูนย์
func MakeHandler(h APIFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// รัน Handler จริงๆ ของเรา ถ้ารันผ่านฉลุย err จะเป็น nil
		if err := h(w, r); err != nil {
			
			// ถ้ามี Error เกิดขึ้น ให้เช็คว่าเป็น APIError ที่เราสร้างไว้ไหม
			var apiErr *APIError
			if errors.As(err, &apiErr) {
				// ถ้าใช่: ส่ง Status Code และ Message กลับไปให้หน้าเว็บ
				log.Printf("[API ERROR] %s: %v", r.URL.Path, apiErr.Err)
				respondError(w, apiErr.StatusCode, apiErr.Message)
			} else {
				// ถ้าไม่ใช่ (เป็น Error ทั่วไปที่ไม่ได้ดักไว้): ส่ง 500 Internal Server Error
				log.Printf("[SYSTEM ERROR] %s: %v", r.URL.Path, err)
				respondError(w, http.StatusInternalServerError, "Internal server error")
			}
		}
	}
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




