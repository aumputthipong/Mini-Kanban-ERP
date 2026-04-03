package util

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// StringToNull แปลง string เป็น sql.NullString (ใช้ตอนส่งเข้า DB)
func StringToNull(s string) sql.NullString {
	return sql.NullString{
		String: s,
		Valid:  s != "",
	}
}

// NullToString แปลง sql.NullString เป็น *string (ใช้ตอนส่งออกไป JSON/Frontend)
func NullToString(ns sql.NullString) *string {
	if !ns.Valid {
		return nil
	}
	return &ns.String
}

// TimeToNull แปลง string (ISO Date) เป็น sql.NullTime
func TimeToNull(dateStr string) sql.NullTime {
	if dateStr == "" {
		return sql.NullTime{Valid: false}
	}
	t, err := time.Parse(time.RFC3339, dateStr)
	if err != nil {
		return sql.NullTime{Valid: false}
	}
	return sql.NullTime{Time: t, Valid: true}
}

// ToNullString เปลี่ยน string เป็น sql.NullString สำหรับส่งเข้า DB
func ToNullString(s string) sql.NullString {
	return sql.NullString{
		String: s,
		Valid:  s != "",
	}
}

// ToNullUUID เปลี่ยน string เป็น uuid.NullUUID
func ToNullUUID(s string) uuid.NullUUID {
	if s == "" {
		return uuid.NullUUID{Valid: false}
	}
	id, err := uuid.Parse(s)
	if err != nil {
		return uuid.NullUUID{Valid: false}
	}
	return uuid.NullUUID{UUID: id, Valid: true}
}

// ParseTime แปลง string (ISO 8601) เป็น time.Time
func ParseTime(s string) time.Time {
	if s == "" {
		return time.Time{}
	}
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		// ถ้าเป็นรูปแบบ YYYY-MM-DD
		t, _ = time.Parse("2006-01-02", s)
	}
	return t
}

// ToNullTime เปลี่ยน string เป็น sql.NullTime
func ToNullTime(s string) sql.NullTime {
	t := ParseTime(s)
	return sql.NullTime{
		Time:  t,
		Valid: !t.IsZero(),
	}
}

// ToNullFloat64 แปลง interface{} (จาก JSON) เป็น sql.NullFloat64
func ToNullFloat64(v interface{}) sql.NullFloat64 {
	f, ok := v.(float64)
	if !ok {
		return sql.NullFloat64{Valid: false}
	}
	return sql.NullFloat64{Float64: f, Valid: true}
}

// PtrToNullString: *string -> sql.NullString
func PtrToNullString(s *string) sql.NullString {
	if s == nil {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: *s, Valid: true}
}

// PtrToNullTime: *time.Time -> sql.NullTime
func PtrToNullTime(t *time.Time) sql.NullTime {
	if t == nil {
		return sql.NullTime{Valid: false}
	}
	return sql.NullTime{Time: *t, Valid: true}
}

// PtrToNullUUID: *string -> uuid.NullUUID
func PtrToNullUUID(s *string) uuid.NullUUID {
	if s == nil || *s == "" {
		return uuid.NullUUID{Valid: false}
	}
	id, err := uuid.Parse(*s)
	if err != nil {
		return uuid.NullUUID{Valid: false}
	}
	return uuid.NullUUID{UUID: id, Valid: true}
}

func PtrUUIDToNullUUID(u *uuid.UUID) uuid.NullUUID {
	if u == nil {
		return uuid.NullUUID{Valid: false}
	}
	return uuid.NullUUID{
		UUID:  *u,
		Valid: true,
	}
}

func NullToTimePtr(nt sql.NullTime) *time.Time {
	if !nt.Valid {
		return nil
	}
	return &nt.Time
}

// NullUUIDToPtr: uuid.NullUUID -> *uuid.UUID
func NullUUIDToPtr(nu uuid.NullUUID) *uuid.UUID {
	if !nu.Valid {
		return nil
	}
	return &nu.UUID
}

func StringToPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// StringToPgDate แปลง string เป็น pgtype.Date
func StringToPgDate(s string) pgtype.Date {
	if s == "" {
		return pgtype.Date{Valid: false}
	}
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		t, _ = time.Parse("2006-01-02", s)
	}
	return pgtype.Date{Time: t, Valid: !t.IsZero()}
}

// StringToPgUUID แปลง string เป็น pgtype.UUID
func StringToPgUUID(s string) pgtype.UUID {
	if s == "" {
		return pgtype.UUID{Valid: false}
	}
	var u pgtype.UUID
	err := u.Scan(s)
	if err != nil {
		return pgtype.UUID{Valid: false}
	}
	return u
}

// FloatToPgNumeric แปลง float64 เป็น pgtype.Numeric
func FloatToPgNumeric(f float64) pgtype.Numeric {
	if f == 0 { // สมมติว่า 0 คือไม่ได้ส่งค่ามา
		return pgtype.Numeric{Valid: false}
	}
	var n pgtype.Numeric
	n.Scan(fmt.Sprintf("%f", f))
	return n
}

func PtrToPgDate(t *time.Time) pgtype.Date {
	if t == nil {
		return pgtype.Date{Valid: false}
	}
	return pgtype.Date{Time: *t, Valid: true}
}

// PtrUUIDToPgUUID แปลง *uuid.UUID เป็น pgtype.UUID
func PtrUUIDToPgUUID(u *uuid.UUID) pgtype.UUID {
	if u == nil {
		return pgtype.UUID{Valid: false}
	}
	var pgUUID pgtype.UUID
	err := pgUUID.Scan(u.String())
	if err != nil {
		return pgtype.UUID{Valid: false}
	}
	return pgUUID
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

func PgDateToTimePtr(d pgtype.Date) *time.Time {
	if !d.Valid {
		return nil
	}
	t := d.Time
	return &t
}

// PgUUIDToUUIDPtr แปลง pgtype.UUID จาก DB กลับเป็น *uuid.UUID สำหรับ JSON
func PgUUIDToUUIDPtr(u pgtype.UUID) *uuid.UUID {
	if !u.Valid {
		return nil
	}
	// pgtype.UUID เก็บข้อมูลในฟิลด์ Bytes เป็น [16]byte
	parsedUUID, err := uuid.FromBytes(u.Bytes[:])
	if err != nil {
		return nil
	}
	return &parsedUUID
}

func PtrStringToPgDate(s *string) pgtype.Date {
	// ถ้าไม่ได้ส่งค่ามา หรือส่งค่าว่างมา ให้ถือว่าเป็น NULL
	if s == nil || *s == "" {
		return pgtype.Date{Valid: false}
	}

	// พยายามแปลงข้อความให้เป็นเวลา (รองรับ ISO 8601 และ YYYY-MM-DD)
	t, err := time.Parse(time.RFC3339, *s)
	if err != nil {
		t, _ = time.Parse("2006-01-02", *s)
	}

	// ส่งกลับในรูปแบบที่ pgx ต้องการ
	return pgtype.Date{
		Time:  t,
		Valid: !t.IsZero(),
	}
}

func ToPgText(s *string) pgtype.Text {
	if s == nil {
		// ถ้าไม่ได้ส่งค่ามา ให้ Valid เป็น false (กลายเป็น NULL ใน SQL)
		return pgtype.Text{Valid: false}
	}
	// ถ้าส่งค่ามา ให้ใส่ค่าและเซ็ต Valid เป็น true
	return pgtype.Text{String: *s, Valid: true}
}

// ToPgBool แปลง *bool เป็น pgtype.Bool
func ToPgBool(b *bool) pgtype.Bool {
	if b == nil {
		return pgtype.Bool{Valid: false}
	}
	return pgtype.Bool{Bool: *b, Valid: true}
}

// ToPgFloat8 แปลง *float64 เป็น pgtype.Float8
func ToPgFloat8(f *float64) pgtype.Float8 {
	if f == nil {
		return pgtype.Float8{Valid: false}
	}
	return pgtype.Float8{Float64: *f, Valid: true}
}

// ToPgUUID แปลง string ธรรมดาให้เป็น pgtype.UUID
// มีประโยชน์มากเวลาเอา ID จาก URL Param มาใช้
func ToPgUUID(id string) (pgtype.UUID, error) {
	var uuid pgtype.UUID
	err := uuid.Scan(id)
	return uuid, err
}