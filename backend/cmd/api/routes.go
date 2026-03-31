// cmd/api/routes.go
package main

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/handler"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/websocket"
)

func setupRoutes(
	boardHandler *handler.BoardHandler,
	authHandler *handler.AuthHandler,
	hub *websocket.Hub,
) http.Handler {
	r := chi.NewRouter()

	// Global middleware
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(chiMiddleware.RequestID)

	// Public routes
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "API is running")
	})

	r.Get("/ws/{boardID}", func(w http.ResponseWriter, r *http.Request) {
		boardID := chi.URLParam(r, "boardID")
		if boardID == "" {
			http.Error(w, "Board ID is required", http.StatusBadRequest)
			return
		}
		websocket.ServeWs(hub, w, r, boardID)
	})

	r.Route("/api/auth", func(r chi.Router) {
		r.Post("/register", authHandler.Register)
		r.Post("/login",    authHandler.Login)
		r.Post("/oauth",    authHandler.OAuthCallback)
		r.Post("/logout",   authHandler.Logout)
	})

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth)

		r.Get("/api/auth/me", authHandler.Me)

		r.Route("/api/boards", func(r chi.Router) {
			r.Get("/",                boardHandler.GetAllBoards)
			r.Post("/",               boardHandler.CreateBoard)
			r.Get("/{boardID}",       boardHandler.GetBoardData)
			r.Patch("/{boardID}",     boardHandler.UpdateBoard)
			r.Delete("/{boardID}",    boardHandler.MoveToTrash)
		})

		r.Route("/api/cards", func(r chi.Router) {
			r.Post("/",              boardHandler.CreateCard)
			r.Patch("/{cardID}",     boardHandler.UpdateCard)
			// r.Delete("/{cardID}",    boardHandler.DeleteCard)
		})

		r.Route("/api/trash", func(r chi.Router) {
			r.Get("/",               boardHandler.GetTrash)
			r.Delete("/{boardID}",   boardHandler.HardDelete)
			// r.Patch("/{boardID}",    boardHandler.RestoreBoard)
		})
	})

	return r
}