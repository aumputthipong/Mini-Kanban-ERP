// cmd/api/main.go
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
	DBUrl            string
	Port             string
	FrontendURL      string
	GoogleClientID   string
	GoogleClientSecret string
	GoogleRedirect   string
	Production       bool
}

func loadConfig() config {
	cfg := config{
		DBUrl:              os.Getenv("DB_URL"),
		Port:               os.Getenv("PORT"),
		FrontendURL:        os.Getenv("FRONTEND_URL"),
		Production:         os.Getenv("ENV") == "production",
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirect:     os.Getenv("GOOGLE_REDIRECT_URL"),
	}
	if cfg.DBUrl == "" {
		log.Fatal("DB_URL is required but not set")
	}
	if os.Getenv("JWT_SECRET") == "" {
		log.Fatal("JWT_SECRET is required but not set")
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

func run(ctx context.Context, cfg config) error {
	pool, err := initDB(ctx, cfg.DBUrl)
	if err != nil {
		return fmt.Errorf("database init failed: %w", err)
	}
	defer pool.Close()
	log.Println("Successfully connected to PostgreSQL")

	queries := db.New(pool)

	activityService := service.NewActivityService(queries)
	boardCmdService := service.NewBoardCommandService(queries)

	hub := websocket.NewHub(boardCmdService, activityService)
	go hub.Run()

	boardService := service.NewBoardService(pool, queries)
	authService := service.NewAuthService(queries)
	subtaskService := service.NewSubtaskService(pool)

	tagService := service.NewTagService(pool, queries)

	subtaskHandler := handler.NewSubtaskHandler(subtaskService)
	boardHandler := handler.NewBoardHandler(boardService)
	tagHandler := handler.NewTagHandler(tagService)
	activityHandler := handler.NewActivityHandler(activityService)
	authHandler := handler.NewAuthHandler(authService, cfg.Production)
	oauthHandler := handler.NewOAuthHandler(
		cfg.GoogleClientID,
		cfg.GoogleClientSecret,
		cfg.GoogleRedirect,
		cfg.FrontendURL,
		authService,
		cfg.Production,
	)

	router := setupRoutes(boardHandler, authHandler, oauthHandler, subtaskHandler, tagHandler, activityHandler, hub)
	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: middleware.CORS(cfg.FrontendURL, router),
	}

	ctx, stop := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Printf("Server is running on port %s\n", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("ListenAndServe: %v", err)
		}
	}()

	<-ctx.Done()
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
