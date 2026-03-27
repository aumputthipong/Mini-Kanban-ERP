package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/handler"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/websocket"
	"github.com/joho/godotenv"
)
func main() {
	// 1. โหลดไฟล์ .env
	// หากไม่พบไฟล์ ระบบจะไม่พัง แต่จะข้ามไปอ่านจากตัวแปรระบบ (System Env) ของ Server จริง
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, falling back to system environment variables")
	}

	// 2. อ่านค่าจาก Environment Variables พร้อมกำหนดค่าเริ่มต้น (Fallback) หากไม่มีการตั้งค่าไว้
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL is required but not set")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // ค่าเริ่มต้น
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000" // ค่าเริ่มต้น
	}

	// 3. เชื่อมต่อ Database โดยใช้ dbURL จาก .env
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("Could not ping database: %v", err)
	}
	fmt.Println("Successfully connected to PostgreSQL!")

	queries := db.New(pool)
	hub := websocket.NewHub(queries)
	go hub.Run()

	// 4. ส่ง frontendURL เข้าไปใน Handler
	boardHandler := handler.NewBoardHandler(queries, frontendURL)

	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "API is running")
	})

	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		websocket.ServeWs(hub, w, r)
	})

	mux.HandleFunc("/api/boards/", boardHandler.GetBoardData)

	// 5. เปิด Web Server โดยใช้พอร์ตจาก .env
	fmt.Printf("Server is running on port %s\n", port)

	server := &http.Server{
		Addr:    ":" + port, // เพิ่ม colon (:) นำหน้าตัวเลขพอร์ต
		Handler: mux,
	}

	if err := server.ListenAndServe(); err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}