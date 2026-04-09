package mock

import (
	"context"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
)

// MockAuthService implements service.AuthServicer
type MockAuthService struct {
	RegisterFn        func(ctx context.Context, arg service.RegisterParams) (db.User, error)
	LoginFn           func(ctx context.Context, email, password string) (db.User, error)
	UpsertOAuthUserFn func(ctx context.Context, email, fullName, provider, providerID string) (db.User, error)
}

func (m *MockAuthService) Register(ctx context.Context, arg service.RegisterParams) (db.User, error) {
	return m.RegisterFn(ctx, arg)
}

func (m *MockAuthService) Login(ctx context.Context, email, password string) (db.User, error) {
	return m.LoginFn(ctx, email, password)
}

func (m *MockAuthService) UpsertOAuthUser(ctx context.Context, email, fullName, provider, providerID string) (db.User, error) {
	return m.UpsertOAuthUserFn(ctx, email, fullName, provider, providerID)
}
