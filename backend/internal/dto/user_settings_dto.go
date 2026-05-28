package dto

// UserSettingsResponse mirrors the user_settings row on the wire.
type UserSettingsResponse struct {
	DefaultLanding string `json:"default_landing"`
	ShowAllCards   bool   `json:"show_all_cards"`
	Timezone       string `json:"timezone"`
}

// UpdateUserSettingsRequest is the PATCH body for /api/me/settings. Omitted
// (nil) fields leave the stored value untouched. default_landing is
// validated server-side against the three allowed values.
type UpdateUserSettingsRequest struct {
	DefaultLanding *string `json:"default_landing" validate:"omitempty,oneof=today my_work all_boards"`
	ShowAllCards   *bool   `json:"show_all_cards"`
	Timezone       *string `json:"timezone"        validate:"omitempty,min=1,max=50"`
}
