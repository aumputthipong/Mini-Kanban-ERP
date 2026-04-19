package dto

import "encoding/json"

type ActivityResponse struct {
	ID         string          `json:"id"`
	BoardID    string          `json:"board_id"`
	ActorID    string          `json:"actor_id"`
	ActorName  *string         `json:"actor_name,omitempty"`
	EventType  string          `json:"event_type"`
	EntityType string          `json:"entity_type"`
	EntityID   *string         `json:"entity_id,omitempty"`
	Payload    json.RawMessage `json:"payload"`
	CreatedAt  string          `json:"created_at"`
}
