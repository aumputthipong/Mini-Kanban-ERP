package httputil

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func DecodeJSON(r *http.Request, v interface{}) error {
    return json.NewDecoder(r.Body).Decode(v)
}

func GetUUIDParam(r *http.Request, key string) (uuid.UUID, error) {
    paramStr := chi.URLParam(r, key)
    if paramStr == "" {
        return uuid.Nil, errors.New("missing parameter")
    }
    return uuid.Parse(paramStr)
}