// cmd/api/routes.go
package main

import (
	"fmt"
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/handler"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/websocket"
	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
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
		r.Post("/login", authHandler.Login)
		r.Post("/oauth", authHandler.OAuthCallback)
		r.Post("/logout", authHandler.Logout)
	})

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth)

		r.Get("/api/auth/me", authHandler.Me)
		r.Get("/api/users", boardHandler.GetAllUsers)

		r.Route("/api/boards", func(r chi.Router) {
			r.Get("/", handler.MakeHandler(boardHandler.GetAllBoards))
			r.Post("/", handler.MakeHandler(boardHandler.CreateBoard))
			r.Get("/{boardID}", handler.MakeHandler(boardHandler.GetBoardData))
			r.Patch("/{boardID}", handler.MakeHandler(boardHandler.UpdateBoard))
			r.Delete("/{boardID}", handler.MakeHandler(boardHandler.MoveToTrash))

			// Members — nested ใน /{boardID}
			r.Route("/{boardID}/members", func(r chi.Router) {
				r.Get("/", boardHandler.GetBoardMembers)
				r.Post("/", boardHandler.AddBoardMember)
				r.Delete("/{userID}", boardHandler.RemoveBoardMember)
				r.Patch("/{userID}", boardHandler.UpdateMemberRole)
			})
		})
		r.Route("/api/cards", func(r chi.Router) {
			r.Post("/", boardHandler.CreateCard)
			r.Patch("/{cardID}", boardHandler.UpdateCard)
			r.Get("/{cardID}", boardHandler.GetCard)
			// r.Delete("/{cardID}",    boardHandler.DeleteCard)
		})

		r.Route("/api/trash", func(r chi.Router) {
			r.Get("/", handler.MakeHandler(boardHandler.GetTrash))
			r.Delete("/{boardID}", handler.MakeHandler(boardHandler.HardDelete))
			// r.Patch("/{boardID}",    boardHandler.RestoreBoard)
		})

	})

	return r
}
