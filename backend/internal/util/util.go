package util

import (
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// ParseTime แปลง string (ISO 8601 หรือ YYYY-MM-DD) เป็น time.Time
func ParseTime(s string) time.Time {
	if s == "" {
		return time.Time{}
	}
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		t, _ = time.Parse("2006-01-02", s)
	}
	return t
}

// StringToTimePtr แปลง string เป็น *time.Time (คืน nil ถ้า string ว่างหรือ parse ไม่ได้)
func StringToTimePtr(s string) *time.Time {
	if s == "" {
		return nil
	}
	t := ParseTime(s)
	if t.IsZero() {
		return nil
	}
	return &t
}

// PtrStringToTimePtr แปลง *string เป็น *time.Time
func PtrStringToTimePtr(s *string) *time.Time {
	if s == nil {
		return nil
	}
	return StringToTimePtr(*s)
}

// StringToPtr คืน nil ถ้า string ว่าง มิฉะนั้นคืน pointer ไปที่ string นั้น
func StringToPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// FloatToPgNumeric แปลง float64 เป็น pgtype.Numeric (ใช้สำหรับ budget, estimated_hours)
func FloatToPgNumeric(f float64) pgtype.Numeric {
	if f == 0 {
		return pgtype.Numeric{Valid: false}
	}
	var n pgtype.Numeric
	n.Scan(fmt.Sprintf("%f", f))
	return n
}

// PtrFloatToPgNumeric แปลง *float64 เป็น pgtype.Numeric
func PtrFloatToPgNumeric(f *float64) pgtype.Numeric {
	if f == nil {
		return pgtype.Numeric{Valid: false}
	}
	var n pgtype.Numeric
	n.Scan(fmt.Sprintf("%f", *f))
	return n
}

// TimeToTimestamptz แปลง *time.Time เป็น pgtype.Timestamptz
// ใช้กับ field ที่ยังเป็น pgtype.Timestamptz (เช่น completed_at ที่ใช้ TIMESTAMP WITH TIME ZONE ใน schema)
func TimeToTimestamptz(t *time.Time) pgtype.Timestamptz {
	if t == nil {
		return pgtype.Timestamptz{Valid: false}
	}
	return pgtype.Timestamptz{Time: *t, Valid: true}
}
