// Package core holds domain types that don't depend on any other internal
// package — primary keys, enums, and value objects. Anything here can be
// imported by every other package without creating a cycle.
package core

// BoardRole is the per-board permission level a user holds. Values map 1:1
// to the `role` column on the board_members table.
type BoardRole string

const (
	RoleOwner   BoardRole = "owner"
	RoleManager BoardRole = "manager"
	RoleMember  BoardRole = "member"
)

// IsValid reports whether r is one of the known role values. Use this to
// reject unknown role strings coming in from API payloads before persisting.
func (r BoardRole) IsValid() bool {
	switch r {
	case RoleOwner, RoleManager, RoleMember:
		return true
	}
	return false
}
