package httputil

import (
    "encoding/json"
    "net/http"
)

// สังเกตว่าเปลี่ยนตัว R เป็นตัวพิมพ์ใหญ่
func RespondJSON(w http.ResponseWriter, status int, payload interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    if payload != nil {
        json.NewEncoder(w).Encode(payload)
    }
}

// สังเกตว่าเปลี่ยนตัว R เป็นตัวพิมพ์ใหญ่
func RespondError(w http.ResponseWriter, status int, message string) {
    RespondJSON(w, status, map[string]string{"error": message})
}