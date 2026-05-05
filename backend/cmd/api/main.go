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
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/handler"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/migrate"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

// version is set at build time via -ldflags "-X main.version=..."; defaults to "dev" locally.
var version = "dev"

const (
	shutdownTimeout = 30 * time.Second
	dbPoolMaxConns  = 25
	dbPoolMinConns  = 5
	dbPoolMaxIdle   = 5 * time.Minute
)

type config struct {
	DBUrl              string
	Port               string
	FrontendURL        string
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirect     string
	MigrationsPath     string
	SkipMigrations     bool
	Production         bool
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
		MigrationsPath:     os.Getenv("MIGRATIONS_PATH"),
		SkipMigrations:     os.Getenv("SKIP_MIGRATIONS") == "true",
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
	if cfg.MigrationsPath == "" {
		cfg.MigrationsPath = "database/migrations"
	}
	return cfg
}

func initDB(ctx context.Context, dbURL string) (*pgxpool.Pool, error) {
	poolCfg, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		return nil, fmt.Errorf("parse db config: %w", err)
	}
	poolCfg.MaxConns = dbPoolMaxConns
	poolCfg.MinConns = dbPoolMinConns
	poolCfg.MaxConnIdleTime = dbPoolMaxIdle

	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("could not ping database: %w", err)
	}
	return pool, nil
}

func run(ctx context.Context, cfg config) error {
	if !cfg.SkipMigrations {
		log.Println("Running database migrations...")
		if err := migrate.Run(cfg.MigrationsPath, cfg.DBUrl); err != nil {
			return fmt.Errorf("migrations failed: %w", err)
		}
	} else {
		log.Println("Skipping migrations (SKIP_MIGRATIONS=true)")
	}

	pool, err := initDB(ctx, cfg.DBUrl)
	if err != nil {
		return fmt.Errorf("database init failed: %w", err)
	}
	defer pool.Close()
	log.Println("Successfully connected to PostgreSQL")

	queries := db.New(pool)

	activityService := service.NewActivityService(queries)

	hub := websocket.NewHub(queries, activityService)
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

	startedAt := time.Now()
	router := setupRoutes(routerDeps{
		boardService:    boardService,
		boardHandler:    boardHandler,
		authHandler:     authHandler,
		oauthHandler:    oauthHandler,
		subtaskHandler:  subtaskHandler,
		tagHandler:      tagHandler,
		activityHandler: activityHandler,
		hub:             hub,
		pool:            pool,
		version:         version,
		startedAt:       startedAt,
	})

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           middleware.CORS(cfg.FrontendURL, router),
		ReadHeaderTimeout: 10 * time.Second,
	}

	ctx, stop := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Printf("Server listening on :%s (version=%s)", cfg.Port, version)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("ListenAndServe: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("Shutdown signal received — draining...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("graceful shutdown failed: %w", err)
	}
	log.Println("Server stopped cleanly")
	return nil
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
