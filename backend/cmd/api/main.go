package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/websocket"
)
func main() {
	// 1. เชื่อมต่อ Database
	dbURL := "postgres://erp_user:erp_password@127.0.0.1:5432/erp_kanban?sslmode=disable"
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer pool.Close()

	err = pool.Ping(ctx)
	if err != nil {
		log.Fatalf("Could not ping database: %v", err)
	}
	fmt.Println("Successfully connected to PostgreSQL!")

	// 2. เริ่มต้นระบบ WebSocket Hub (เพิ่มส่วนนี้เข้ามา)
	hub := websocket.NewHub()
	go hub.Run() // ต้องใช้ go (Goroutine) เพื่อให้ Hub ทำงานเป็น Background รอรับข้อมูลตลอดเวลา

	// 3. กำหนด Route สำหรับ WebSocket
	// เมื่อมี Request แบบ GET เข้ามาที่ /ws ระบบจะโยนให้ฟังก์ชัน ServeWs ทำการ Upgrade เป็น WebSocket
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		websocket.ServeWs(hub, w, r)
	})

	// (ทางเลือก) สร้าง Health Check Endpoint เพื่อไว้ทดสอบผ่าน Browser ปกติ
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "API is running")
	})

	// 4. เปิด Web Server
	port := ":8080"
	fmt.Printf("Server is running on http://localhost%s\n", port)
	
	err = http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}