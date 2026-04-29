// cmd/api/routes.go
package main

import (
	"fmt"
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/core"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/handler"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/websocket"
	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
)

func setupRoutes(
	boardService service.BoardServicer,
	boardHandler *handler.BoardHandler,
	authHandler *handler.AuthHandler,
	oauthHandler *handler.OAuthHandler,
	subtaskHandler *handler.SubtaskHandler,
	tagHandler *handler.TagHandler,
	activityHandler *handler.ActivityHandler,
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

	r.Route("/api/auth", func(r chi.Router) {
		r.Post("/register", httputil.MakeHandler(authHandler.Register))
		r.Post("/login", httputil.MakeHandler(authHandler.Login))
		r.Post("/oauth", httputil.MakeHandler(authHandler.OAuthCallback))
		r.Post("/logout", httputil.MakeHandler(authHandler.Logout))

		r.Get("/google", httputil.MakeHandler(oauthHandler.RedirectToGoogle))
		r.Get("/google/callback", httputil.MakeHandler(oauthHandler.HandleGoogleCallback))
	})

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth)

		r.Get("/ws/{boardID}", func(w http.ResponseWriter, r *http.Request) {
			boardID := chi.URLParam(r, "boardID")
			if boardID == "" {
				http.Error(w, "Board ID is required", http.StatusBadRequest)
				return
			}
			websocket.ServeWs(hub, w, r, boardID)
		})

		r.Get("/api/auth/me", httputil.MakeHandler(authHandler.Me))
		r.Get("/api/users", httputil.MakeHandler(boardHandler.GetAllUsers))

		r.Route("/api/my-tasks", func(r chi.Router) {
			r.Get("/", httputil.MakeHandler(boardHandler.GetMyTasks))
			r.Post("/{cardID}/complete", httputil.MakeHandler(boardHandler.CompleteMyTask))
		})

		requireBoardMember := middleware.RequireBoardMember(boardService)

		r.Route("/api/boards", func(r chi.Router) {
			r.Get("/", httputil.MakeHandler(boardHandler.GetAllBoards))
			r.Post("/", httputil.MakeHandler(boardHandler.CreateBoard))

			// Per-board routes — gated by membership, then by role per action
			r.Route("/{boardID}", func(r chi.Router) {
				r.Use(requireBoardMember)

				// Read — any member
				r.Get("/", httputil.MakeHandler(boardHandler.GetBoardData))
				r.Get("/activities", httputil.MakeHandler(activityHandler.ListByBoard))

				// Update board title/budget — manager+
				r.With(middleware.RequireBoardRole(core.RoleManager)).
					Patch("/", httputil.MakeHandler(boardHandler.UpdateBoard))

				// Move to trash — owner only
				r.With(middleware.RequireBoardRole(core.RoleOwner)).
					Delete("/", httputil.MakeHandler(boardHandler.MoveToTrash))

				r.Route("/members", func(r chi.Router) {
					// View member list — any member
					r.Get("/", httputil.MakeHandler(boardHandler.GetBoardMembers))

					// Leave board — any member (except owner, enforced in handler)
					r.Delete("/me", httputil.MakeHandler(boardHandler.LeaveBoard))

					// Invite / change role / remove — manager+
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequireBoardRole(core.RoleManager))
						r.Post("/", httputil.MakeHandler(boardHandler.AddBoardMember))
						r.Delete("/{userID}", httputil.MakeHandler(boardHandler.RemoveBoardMember))
						r.Patch("/{userID}", httputil.MakeHandler(boardHandler.UpdateMemberRole))
					})
				})

				r.Route("/tags", func(r chi.Router) {
					// Read — any member
					r.Get("/", httputil.MakeHandler(tagHandler.GetBoardTags))

					// Create / delete — manager+
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequireBoardRole(core.RoleManager))
						r.Post("/", httputil.MakeHandler(tagHandler.CreateBoardTag))
						r.Delete("/{tagID}", httputil.MakeHandler(tagHandler.DeleteBoardTag))
					})
				})
			})
		})
		r.Route("/api/cards", func(r chi.Router) {
			r.Post("/", httputil.MakeHandler(boardHandler.CreateCard))
			r.Patch("/{cardID}", httputil.MakeHandler(boardHandler.UpdateCard))
			r.Get("/{cardID}", httputil.MakeHandler(boardHandler.GetCard))
			// r.Delete("/{cardID}",    boardHandler.DeleteCard)
			r.Route("/{cardID}/subtasks", func(r chi.Router) {
				r.Post("/", httputil.MakeHandler(subtaskHandler.CreateSubtask))
				r.Get("/", httputil.MakeHandler(subtaskHandler.GetSubtasks))
				r.Get("/{subtaskID}", httputil.MakeHandler(subtaskHandler.GetSubtask))
				r.Patch("/{subtaskID}", httputil.MakeHandler(subtaskHandler.UpdateSubtask))
				r.Delete("/{subtaskID}", httputil.MakeHandler(subtaskHandler.DeleteSubtask))
			})
		})

		r.Route("/api/trash", func(r chi.Router) {
			// List trashed boards — filtered to owner inside handler
			r.Get("/", httputil.MakeHandler(boardHandler.GetTrash))

			// Hard delete / restore — owner only (membership + role checked per board)
			r.Route("/{boardID}", func(r chi.Router) {
				r.Use(requireBoardMember)
				r.Use(middleware.RequireBoardRole(core.RoleOwner))
				r.Delete("/", httputil.MakeHandler(boardHandler.HardDelete))
				r.Patch("/restore", httputil.MakeHandler(boardHandler.RestoreBoard))
			})
		})

	})

	return r
}
