package httputil

import (
	"errors"
	"log"
	"net/http"
)

// APIError is a typed error that carries an HTTP status code and a user-facing message.
type APIError struct {
	StatusCode int
	Message    string
	Err        error
}

func (e *APIError) Error() string {
	if e.Err != nil {
		return e.Message + ": " + e.Err.Error()
	}
	return e.Message
}

func NewAPIError(statusCode int, message string, err error) *APIError {
	return &APIError{
		StatusCode: statusCode,
		Message:    message,
		Err:        err,
	}
}

// APIFunc is an http.HandlerFunc variant that returns an error.
type APIFunc func(w http.ResponseWriter, r *http.Request) error

// MakeHandler wraps an APIFunc, centralising error handling and logging.
func MakeHandler(h APIFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := h(w, r); err != nil {
			var apiErr *APIError
			if errors.As(err, &apiErr) {
				log.Printf("[API ERROR] %s: %v", r.URL.Path, apiErr.Err)
				RespondError(w, apiErr.StatusCode, apiErr.Message)
			} else {
				log.Printf("[SYSTEM ERROR] %s: %v", r.URL.Path, err)
				RespondError(w, http.StatusInternalServerError, "Internal server error")
			}
		}
	}
}
