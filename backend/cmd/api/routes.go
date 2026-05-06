// cmd/api/routes.go
package main

import (
	"context"
	"net/http"
	"time"

	_ "github.com/aumputthipong/mini-erp-kanban/backend/docs" // swagger generated
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/core"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/handler"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/websocket"
	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	httpSwagger "github.com/swaggo/http-swagger/v2"
)

type routerDeps struct {
	boardService    service.BoardServicer
	boardHandler    *handler.BoardHandler
	authHandler     *handler.AuthHandler
	oauthHandler    *handler.OAuthHandler
	subtaskHandler  *handler.SubtaskHandler
	tagHandler      *handler.TagHandler
	activityHandler *handler.ActivityHandler
	hub             *websocket.Hub
	pool            *pgxpool.Pool
	version         string
	production      bool
	startedAt       time.Time
}

func setupRoutes(d routerDeps) http.Handler {
	r := chi.NewRouter()

	// Global middleware
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(chiMiddleware.RequestID)
	r.Use(middleware.SecurityHeaders(d.production))

	// Health endpoints — used by load balancers / uptime monitors / k8s probes
	r.Get("/health", healthHandler(d.pool, d.version, d.startedAt))
	r.Get("/healthz", healthHandler(d.pool, d.version, d.startedAt))

	// API docs (Swagger UI). Spec is regenerated via `swag init` — see Makefile.
	// In production, gate behind an admin flag or remove if not desired.
	r.Get("/docs/*", httpSwagger.Handler(httpSwagger.URL("/docs/doc.json")))

	r.Route("/api/auth", func(r chi.Router) {
		r.Use(middleware.AuthRateLimit())

		r.Post("/register", httputil.MakeHandler(d.authHandler.Register))
		r.Post("/login", httputil.MakeHandler(d.authHandler.Login))
		r.Post("/oauth", httputil.MakeHandler(d.authHandler.OAuthCallback))
		r.Post("/logout", httputil.MakeHandler(d.authHandler.Logout))

		r.Get("/google", httputil.MakeHandler(d.oauthHandler.RedirectToGoogle))
		r.Get("/google/callback", httputil.MakeHandler(d.oauthHandler.HandleGoogleCallback))
	})

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.GeneralRateLimit())
		r.Use(middleware.RequireAuth)

		r.Get("/ws/{boardID}", func(w http.ResponseWriter, r *http.Request) {
			boardID := chi.URLParam(r, "boardID")
			if boardID == "" {
				http.Error(w, "Board ID is required", http.StatusBadRequest)
				return
			}
			websocket.ServeWs(d.hub, w, r, boardID)
		})

		r.Get("/api/auth/me", httputil.MakeHandler(d.authHandler.Me))
		r.Get("/api/users", httputil.MakeHandler(d.boardHandler.GetAllUsers))

		r.Route("/api/my-tasks", func(r chi.Router) {
			r.Get("/", httputil.MakeHandler(d.boardHandler.GetMyTasks))
			r.Post("/{cardID}/complete", httputil.MakeHandler(d.boardHandler.CompleteMyTask))
		})

		requireBoardMember := middleware.RequireBoardMember(d.boardService)

		r.Route("/api/boards", func(r chi.Router) {
			r.Get("/", httputil.MakeHandler(d.boardHandler.GetAllBoards))
			r.Post("/", httputil.MakeHandler(d.boardHandler.CreateBoard))

			r.Route("/{boardID}", func(r chi.Router) {
				r.Use(requireBoardMember)

				r.Get("/", httputil.MakeHandler(d.boardHandler.GetBoardData))
				r.Get("/activities", httputil.MakeHandler(d.activityHandler.ListByBoard))

				r.With(middleware.RequireBoardRole(core.RoleManager)).
					Patch("/", httputil.MakeHandler(d.boardHandler.UpdateBoard))

				r.With(middleware.RequireBoardRole(core.RoleOwner)).
					Delete("/", httputil.MakeHandler(d.boardHandler.MoveToTrash))

				r.Route("/members", func(r chi.Router) {
					r.Get("/", httputil.MakeHandler(d.boardHandler.GetBoardMembers))
					r.Delete("/me", httputil.MakeHandler(d.boardHandler.LeaveBoard))

					r.Group(func(r chi.Router) {
						r.Use(middleware.RequireBoardRole(core.RoleManager))
						r.Post("/", httputil.MakeHandler(d.boardHandler.AddBoardMember))
						r.Delete("/{userID}", httputil.MakeHandler(d.boardHandler.RemoveBoardMember))
						r.Patch("/{userID}", httputil.MakeHandler(d.boardHandler.UpdateMemberRole))
					})
				})

				r.Route("/tags", func(r chi.Router) {
					r.Get("/", httputil.MakeHandler(d.tagHandler.GetBoardTags))

					r.Group(func(r chi.Router) {
						r.Use(middleware.RequireBoardRole(core.RoleManager))
						r.Post("/", httputil.MakeHandler(d.tagHandler.CreateBoardTag))
						r.Delete("/{tagID}", httputil.MakeHandler(d.tagHandler.DeleteBoardTag))
					})
				})
			})
		})

		r.Route("/api/cards", func(r chi.Router) {
			r.Post("/", httputil.MakeHandler(d.boardHandler.CreateCard))
			r.Patch("/{cardID}", httputil.MakeHandler(d.boardHandler.UpdateCard))
			r.Get("/{cardID}", httputil.MakeHandler(d.boardHandler.GetCard))
			r.Route("/{cardID}/subtasks", func(r chi.Router) {
				r.Post("/", httputil.MakeHandler(d.subtaskHandler.CreateSubtask))
				r.Get("/", httputil.MakeHandler(d.subtaskHandler.GetSubtasks))
				r.Get("/{subtaskID}", httputil.MakeHandler(d.subtaskHandler.GetSubtask))
				r.Patch("/{subtaskID}", httputil.MakeHandler(d.subtaskHandler.UpdateSubtask))
				r.Delete("/{subtaskID}", httputil.MakeHandler(d.subtaskHandler.DeleteSubtask))
			})
		})

		r.Route("/api/trash", func(r chi.Router) {
			r.Get("/", httputil.MakeHandler(d.boardHandler.GetTrash))

			r.Route("/{boardID}", func(r chi.Router) {
				r.Use(requireBoardMember)
				r.Use(middleware.RequireBoardRole(core.RoleOwner))
				r.Delete("/", httputil.MakeHandler(d.boardHandler.HardDelete))
				r.Patch("/restore", httputil.MakeHandler(d.boardHandler.RestoreBoard))
			})
		})
	})

	return r
}

// HealthResponse is the body returned by /health and /healthz.
//
// swagger:model HealthResponse
type HealthResponse struct {
	Status      string `json:"status"          example:"ok"`
	Version     string `json:"version"         example:"v0.3.0"`
	UptimeSecs  int64  `json:"uptime_seconds"  example:"42"`
	DBConnected bool   `json:"db_connected"    example:"true"`
}

// healthHandler returns a JSON probe with build version, uptime, and DB connectivity.
// 503 if the DB ping fails so load balancers can drop the instance.
//
// @Summary  Health probe
// @Tags     ops
// @Produce  json
// @Success  200 {object} HealthResponse
// @Failure  503 {object} HealthResponse "DB unreachable"
// @Router   /healthz [get]
func healthHandler(pool *pgxpool.Pool, version string, startedAt time.Time) http.HandlerFunc {
	type response = HealthResponse
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()

		dbOK := pool.Ping(ctx) == nil

		body := response{
			Status:      "ok",
			Version:     version,
			UptimeSecs:  int64(time.Since(startedAt).Seconds()),
			DBConnected: dbOK,
		}
		status := http.StatusOK
		if !dbOK {
			body.Status = "degraded"
			status = http.StatusServiceUnavailable
		}
		httputil.RespondJSON(w, status, body)
	}
}
