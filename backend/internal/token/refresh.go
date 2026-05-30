package token

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"net/http"
	"sync"
	"time"
)

// defaultRefreshTTL is the refresh-token lifetime when REFRESH_TOKEN_TTL is not
// set. A new value is minted on every rotation, so an active user's session
// slides forward indefinitely; only an idle session expires after this window.
// 30d is the real "stay logged in" knob and is safe to keep long because the
// token is opaque, hashed at rest, and revocable server-side.
const defaultRefreshTTL = 30 * 24 * time.Hour

var (
	refreshTTLOnce sync.Once
	refreshTTL     time.Duration
)

// RefreshTokenDuration returns the refresh-token lifetime, read once from
// REFRESH_TOKEN_TTL (a Go duration string such as "720h"). Both the DB
// expires_at and the cookie MaxAge use this value.
func RefreshTokenDuration() time.Duration {
	refreshTTLOnce.Do(func() {
		refreshTTL = parseDurationEnv("REFRESH_TOKEN_TTL", defaultRefreshTTL)
	})
	return refreshTTL
}

// RefreshCookieName is the cookie that carries the opaque refresh token.
const RefreshCookieName = "refresh_token"

// RefreshCookiePath scopes the refresh cookie so it is only sent to the
// refresh endpoint. Combined with SameSite=Strict this means the token never
// leaves the user's tab during ordinary API calls — only the access token in
// the broader auth_token cookie travels with each request.
const RefreshCookiePath = "/api/auth/refresh"

// refreshTokenBytes is the entropy of the raw token. 32 bytes (256 bits) is
// well above the 128-bit floor for unguessable opaque tokens.
const refreshTokenBytes = 32

// GenerateRefreshToken returns an opaque base64url-encoded random token. This
// is intentionally NOT a JWT: we want server-side revocation without a
// blocklist, which means looking up the token in the DB on every refresh.
func GenerateRefreshToken() (string, error) {
	b := make([]byte, refreshTokenBytes)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// HashRefreshToken returns the sha256-hex digest of the raw token. Only the
// hash is stored in the DB so a leaked snapshot of refresh_tokens cannot be
// replayed against the API.
func HashRefreshToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

// SetRefreshCookie writes the refresh token cookie. Path is scoped to the
// refresh endpoint and SameSite is Strict because the cookie should never
// leave the user's own tab.
func SetRefreshCookie(w http.ResponseWriter, raw string, production bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     RefreshCookieName,
		Value:    raw,
		Path:     RefreshCookiePath,
		HttpOnly: true,
		Secure:   production,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   int(RefreshTokenDuration().Seconds()),
	})
}

// ClearRefreshCookie expires the refresh cookie. MaxAge=-1 plus matching Path
// is required — browsers will not clear a cookie whose Path differs.
func ClearRefreshCookie(w http.ResponseWriter, production bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     RefreshCookieName,
		Value:    "",
		Path:     RefreshCookiePath,
		HttpOnly: true,
		Secure:   production,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   -1,
	})
}
