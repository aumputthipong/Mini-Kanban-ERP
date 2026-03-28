package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/handler"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, falling back to system environment variables")
	}
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

	boardService := service.NewBoardService(queries)
	boardHandler := handler.NewBoardHandler(boardService)

	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "API is running")
	})

	mux.HandleFunc("/ws/{boardID}", func(w http.ResponseWriter, r *http.Request) {
		boardID := r.PathValue("boardID") // ดึงค่าจาก URL
		if boardID == "" {
			http.Error(w, "Board ID is required", http.StatusBadRequest)
			return
		}
		websocket.ServeWs(hub, w, r, boardID)
	})

	mux.HandleFunc("/api/boards", boardHandler.HandleBoardsRoute)
	mux.HandleFunc("/api/boards/{boardID}", boardHandler.GetBoardData)
	mux.HandleFunc("/api/cards", boardHandler.CreateCard)

	handlerWithCORS := middleware.CORS(frontendURL, mux)
	
	fmt.Printf("Server is running on port %s\n", port)

	server := &http.Server{
		Addr:    ":" + port,
		Handler: handlerWithCORS,
	}
	if err := server.ListenAndServe(); err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}