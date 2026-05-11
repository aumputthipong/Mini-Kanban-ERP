// Package token issues and verifies the JWT used for session auth, plus the
// helper that sets the `auth_token` HttpOnly cookie. The signing secret is
// loaded once from the JWT_SECRET environment variable; the process aborts
// on startup if it is empty.
package token

import (
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// TokenDuration is how long an issued token remains valid. Cookie MaxAge
// mirrors this value, so logout depends on the cookie being cleared rather
// than on the token expiring.
const TokenDuration = 7 * 24 * time.Hour

// Claims is the JWT body for an authenticated user. UserID is the canonical
// reference; Email is included for ergonomics in logs and is not authoritative
// (a user can change their email; the UserID does not).
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
// It log.Fatal's if JWT_SECRET is missing — this is intentional because
// running with an empty secret would silently accept forged tokens.
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

// Generate signs a new JWT for the given user. The returned string is what
// gets placed in the `auth_token` cookie via SetAuthCookie.
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

// Parse validates the signed token string and returns its claims. It rejects
// any signing method other than HMAC. Returns jwt.ErrTokenInvalidClaims for
// expired, malformed, or wrong-algorithm tokens — callers should treat any
// non-nil error as "unauthenticated" without leaking which check failed.
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

// SetAuthCookie writes the signed JWT into the `auth_token` HttpOnly cookie.
// The Secure flag is set only in production (passed in from main) so local
// HTTP development is not blocked by the browser refusing to send the cookie.
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
