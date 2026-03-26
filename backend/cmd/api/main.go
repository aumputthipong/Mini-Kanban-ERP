package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
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

	queries := db.New(pool)
	// 2. เริ่มต้นระบบ WebSocket Hub (เพิ่มส่วนนี้เข้ามา)
	hub := websocket.NewHub(queries)
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

	http.HandleFunc("/api/boards/", func(w http.ResponseWriter, r *http.Request) {
		// CORS (Best Practice: อนุญาตให้ Frontend พอร์ต 3000 เรียกใช้ได้)
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Content-Type", "application/json")

		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// ใช้ตัวแปรที่ประกาศไว้
		boardIDStr := "452ae618-9e69-49f5-88a9-47728a5f17ac" // ตรวจสอบให้ตรงกับ ID บอร์ดของคุณ

		// แปลง String เป็น pgtype.UUID (เพื่อความปลอดภัยและป้องกัน SQL Injection)
		var boardUUID pgtype.UUID
		err := boardUUID.Scan(boardIDStr)
		if err != nil {
			http.Error(w, "Invalid board ID format", http.StatusBadRequest)
			return
		}

		// ดึงข้อมูล Columns จาก Database โดยใช้ sqlc ที่เรา generate ไว้
		columns, err := queries.GetColumnsByBoardID(r.Context(), boardUUID)
		if err != nil {
			log.Printf("Error fetching columns: %v", err)
			http.Error(w, "Failed to fetch columns", http.StatusInternalServerError)
			return
		}

		// แปลงข้อมูลที่ได้จาก Database เป็น JSON แล้วส่งกลับไปให้ผู้ใช้
		// นี่คือการใช้งานตัวแปรทั้งหมดอย่างสมบูรณ์ Go จะไม่ฟ้อง Error แล้ว
		if err := json.NewEncoder(w).Encode(columns); err != nil {
			log.Printf("Error encoding response: %v", err)
		}
	})
	// 4. เปิด Web Server
	port := ":8080"
	fmt.Printf("Server is running on http://localhost%s\n", port)
	
	err = http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}