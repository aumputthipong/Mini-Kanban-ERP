// internal/token/token.go
package token

import (
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const TokenDuration = 7 * 24 * time.Hour

type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

var (
	jwtSecretOnce sync.Once
	jwtSecret     []byte
)

// secret returns the JWT signing key, initialising it on first use.
func secret() []byte {
	jwtSecretOnce.Do(func() {
		s := os.Getenv("JWT_SECRET")
		if s == "" {
			log.Fatal("JWT_SECRET is required")
		}
		jwtSecret = []byte(s)
	})
	return jwtSecret
}

func Generate(userID, email string) (string, error) {
	claims := Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(TokenDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(secret())
}

func Parse(tokenStr string) (*Claims, error) {
	t, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return secret(), nil
	})
	if err != nil || !t.Valid {
		return nil, jwt.ErrTokenInvalidClaims
	}

	claims, ok := t.Claims.(*Claims)
	if !ok {
		return nil, jwt.ErrTokenInvalidClaims
	}
	return claims, nil
}

// SetAuthCookie sets the auth_token HttpOnly cookie.
// Shared between AuthHandler and OAuthHandler.
func SetAuthCookie(w http.ResponseWriter, tokenStr string, production bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    tokenStr,
		Path:     "/",
		HttpOnly: true,
		Secure:   production,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(TokenDuration.Seconds()),
	})
}
