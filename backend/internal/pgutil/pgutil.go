// internal/pgutil/pgutil.go
package pgutil

import (
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

func PtrToText(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *s, Valid: true}
}

func TextToPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	return &t.String
}

func TextToString(t pgtype.Text) *string {
	return TextToPtr(t)
}

func DateToPtr(d pgtype.Date) *string {
	if !d.Valid {
		return nil
	}
	s := d.Time.Format("2006-01-02")
	return &s
}

func UUIDToPtr(u pgtype.UUID) *string {
	if !u.Valid {
		return nil
	}
	s := u.String()
	return &s
}

func pgDateToPtr(d pgtype.Date) *string {
	if !d.Valid {
		return nil
	}
	s := d.Time.Format("2006-01-02")
	return &s
}

func pgUUIDToPtr(u pgtype.UUID) *string {
	if !u.Valid {
		return nil
	}
	s := u.String()
	return &s
}

func pgTextToPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	return &t.String
}


func PtrToDate(s *string) pgtype.Date {
	if s == nil || *s == "" {
		return pgtype.Date{Valid: false}
	}
	t, err := time.Parse("2006-01-02", *s)
	if err != nil {
		return pgtype.Date{Valid: false}
	}
	return pgtype.Date{Time: t, Valid: true}
}

func PtrToUUID(s *string) pgtype.UUID {
    if s == nil || *s == "" {
        return pgtype.UUID{Valid: false}
    }
    var u pgtype.UUID
    if err := u.Scan(*s); err != nil {
        return pgtype.UUID{Valid: false}
    }
    return u
}