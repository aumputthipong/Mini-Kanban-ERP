// internal/pgutil/pgutil.go
package pgutil

import (
	"fmt"
	"time"

	"github.com/google/uuid"
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

func NilIfEmpty(s string) *string {
    if s == "" {
        return nil
    }
    return &s
}

func DateToTimePtr(d pgtype.Date) *time.Time {
    if !d.Valid {
        return nil
    }
    return &d.Time
}

func NullUUIDToPtr(u uuid.NullUUID) *uuid.UUID {
    if !u.Valid {
        return nil
    }
    // คืนค่า Pointer ของ UUID กลับไป
    return &u.UUID
}

func PgUUIDToPtr(u pgtype.UUID) *uuid.UUID {
    if !u.Valid {
        return nil // ถ้าเป็น NULL ในฐานข้อมูล ให้คืนค่า nil
    }
    // แปลง byte array 16 ตัวของ pgtype ให้กลายเป็นชนิด uuid.UUID ของ Google
    val := uuid.UUID(u.Bytes)
    return &val
}


// PtrToNumeric แปลง *float64 เป็น pgtype.Numeric
func PtrToNumeric(f *float64) pgtype.Numeric {
	if f == nil {
		return pgtype.Numeric{Valid: false}
	}
	var n pgtype.Numeric
	// Scan คืนค่า Error แต่ในบริบทนี้ format %f ปลอดภัย จึงละเว้นการจัดการ Error ได้ระดับหนึ่ง
	n.Scan(fmt.Sprintf("%f", *f))
	return n
}

// PtrToPgUUID แปลง *uuid.UUID เป็น pgtype.UUID (สำหรับ Database ขาเข้า)
func PtrToPgUUID(u *uuid.UUID) pgtype.UUID {
	if u == nil {
		return pgtype.UUID{Valid: false}
	}
	// แปลงข้อมูลแบบ 16 byte กลับเข้าไป
	return pgtype.UUID{
		Bytes: *u,
		Valid: true,
	}
}

// PtrToNullUUID แปลง *uuid.UUID เป็น uuid.NullUUID (ในกรณีที่ sqlc คุณตั้งเป็นของ Google)
func PtrToNullUUID(u *uuid.UUID) uuid.NullUUID {
	if u == nil {
		return uuid.NullUUID{Valid: false}
	}
	return uuid.NullUUID{
		UUID:  *u,
		Valid: true,
	}
}

// TimePtrToDate แปลง *time.Time ของ Go ให้เป็น pgtype.Date สำหรับฐานข้อมูล
func TimePtrToDate(t *time.Time) pgtype.Date {
	if t == nil {
		return pgtype.Date{Valid: false}
	}
	return pgtype.Date{
		Time:  *t,
		Valid: true,
	}
}


