package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/handler"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

type config struct {
	DBUrl       string
	Port        string
	FrontendURL string
}

func loadConfig() config {
	cfg := config{
		DBUrl:       os.Getenv("DB_URL"),
		Port:        os.Getenv("PORT"),
		FrontendURL: os.Getenv("FRONTEND_URL"),
	}
	if cfg.DBUrl == "" {
		log.Fatal("DB_URL is required but not set")
	}
	if cfg.Port == "" {
		cfg.Port = "8080"
	}
	if cfg.FrontendURL == "" {
		cfg.FrontendURL = "http://localhost:3000"
	}
	return cfg
}

func initDB(ctx context.Context, dbURL string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("could not ping database: %w", err)
	}
	return pool, nil
}

func setupRoutes(boardHandler *handler.BoardHandler, hub *websocket.Hub) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "API is running")
	})

	mux.HandleFunc("/ws/{boardID}", func(w http.ResponseWriter, r *http.Request) {
		boardID := r.PathValue("boardID")
		if boardID == "" {
			http.Error(w, "Board ID is required", http.StatusBadRequest)
			return
		}
		websocket.ServeWs(hub, w, r, boardID)
	})

	mux.HandleFunc("/api/boards", boardHandler.HandleBoardsRoute)
	// ถังขยะ
	mux.HandleFunc("/api/trash", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		boardHandler.GetTrash(w, r)
	})

	mux.HandleFunc("/api/trash/{boardID}", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodDelete:
			// สำหรับการกด "ลบถาวร" (Hard Delete) จากหน้าถังขยะ
			boardHandler.HardDelete(w, r)
		case http.MethodPatch:
			// เผื่อคุณอยากทำ "กู้คืน" (Restore) ในอนาคต ใช้ PATCH จะเหมาะสมมากครับ
			// boardHandler.Restore(w, r)
			http.Error(w, "Restore feature coming soon", http.StatusNotImplemented)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// บอร์ดเฉพาะตัว
	mux.HandleFunc("/api/boards/{boardID}", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			boardHandler.GetBoardData(w, r)
		case http.MethodDelete:
			boardHandler.MoveToTrash(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/cards", boardHandler.CreateCard)

	return mux

}

func run(ctx context.Context, cfg config) error {
	pool, err := initDB(ctx, cfg.DBUrl)
	if err != nil {
		return fmt.Errorf("database init failed: %w", err)
	}
	defer pool.Close()
	log.Println("Successfully connected to PostgreSQL")

	queries := db.New(pool)

	hub := websocket.NewHub(queries)
	go hub.Run()

	boardService := service.NewBoardService(queries)
	boardHandler := handler.NewBoardHandler(boardService)

	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: middleware.CORS(cfg.FrontendURL, setupRoutes(boardHandler, hub)),
	}

	ctx, stop := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Printf("Server is running on port %s\n", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("ListenAndServe: %v", err)
		}
	}()

	<-ctx.Done() // รอจนกว่าจะได้รับ signal
	log.Println("Shutting down server...")
	return server.Shutdown(context.Background())
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, falling back to system environment variables")
	}

	cfg := loadConfig()

	if err := run(context.Background(), cfg); err != nil {
		log.Fatal(err)
	}
}
