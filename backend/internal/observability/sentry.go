// Package observability wraps Sentry initialization + the chi-compatible
// recovery middleware that ships panics off to it.
//
// Designed to be **env-gated and no-op when SENTRY_DSN is empty** — local dev
// and CI work without a Sentry project, the same code paths just don't ship
// events.
package observability

import (
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/getsentry/sentry-go"
	sentryhttp "github.com/getsentry/sentry-go/http"
)

// InitSentry initialises the global Sentry hub from env. Returns true if
// Sentry was configured (i.e. SENTRY_DSN was set), false otherwise.
//
// Reads:
//   - SENTRY_DSN          — the project DSN; empty disables Sentry entirely.
//   - SENTRY_ENVIRONMENT  — defaults to ENV if unset, "development" otherwise.
//   - SENTRY_RELEASE      — version tag for releases (defaults to caller-provided).
//   - SENTRY_SAMPLE_RATE  — float 0..1, defaults to 1.0 (capture all errors).
//   - SENTRY_TRACES_SAMPLE_RATE — float 0..1, defaults to 0.1 (10% perf traces).
func InitSentry(release string) bool {
	dsn := os.Getenv("SENTRY_DSN")
	if dsn == "" {
		slog.Info("sentry disabled (SENTRY_DSN not set)")
		return false
	}

	env := os.Getenv("SENTRY_ENVIRONMENT")
	if env == "" {
		env = os.Getenv("ENV")
	}
	if env == "" {
		env = "development"
	}

	if r := os.Getenv("SENTRY_RELEASE"); r != "" {
		release = r
	}

	tracesRate := 0.1
	if v := os.Getenv("SENTRY_TRACES_SAMPLE_RATE"); v != "" {
		if parsed, perr := strconv.ParseFloat(v, 64); perr == nil && parsed >= 0 && parsed <= 1 {
			tracesRate = parsed
		}
	}

	err := sentry.Init(sentry.ClientOptions{
		Dsn:              dsn,
		Environment:      env,
		Release:          release,
		AttachStacktrace: true,
		TracesSampleRate: tracesRate,
	})
	if err != nil {
		slog.Error("sentry init failed", "err", err)
		return false
	}
	slog.Info("sentry enabled", "environment", env, "release", release, "traces_sample_rate", tracesRate)
	return true
}

// FlushSentry blocks for up to timeout while Sentry ships any pending events.
// Call from main.go's deferred shutdown so SIGTERM doesn't drop the last error.
func FlushSentry(timeout time.Duration) {
	sentry.Flush(timeout)
}

// SentryRecoverer is a chi-compatible middleware that catches panics from
// downstream handlers and sends them to Sentry before re-raising.
//
// Mount this BEFORE chi's stdlib `Recoverer` so Sentry captures the panic
// and the stdlib middleware still produces the 500 response.
//
// When Sentry is disabled (no DSN), the underlying middleware is a no-op
// pass-through — chi.Recoverer still handles the response.
func SentryRecoverer() func(http.Handler) http.Handler {
	if os.Getenv("SENTRY_DSN") == "" {
		return func(next http.Handler) http.Handler { return next }
	}
	handler := sentryhttp.New(sentryhttp.Options{
		Repanic: true,
	})
	return handler.Handle
}
