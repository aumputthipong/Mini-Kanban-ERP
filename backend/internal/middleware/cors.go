package middleware

import "net/http"

// CORS allows a single trusted origin (the public frontend URL) and answers
// preflight OPTIONS requests directly. Credentials are allowed because auth
// rides on a cookie. Wildcard origins are NOT supported on purpose — when
// `Access-Control-Allow-Credentials` is true, browsers reject `*` for the
// allow-origin header anyway.
//
// This is wired on the *outermost* middleware layer in main.go so the
// preflight response is returned before any auth or rate-limit logic runs.
func CORS(frontendURL string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", frontendURL)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Content-Type", "application/json")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
