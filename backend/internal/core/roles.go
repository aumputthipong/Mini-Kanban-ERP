package core

// BoardRole กำหนด Type เฉพาะสำหรับสิทธิ์ในบอร์ด
type BoardRole string

// กำหนด Constants แทนการพิมพ์ String ตรงๆ ในโค้ด
const (
	RoleOwner   BoardRole = "owner"
	RoleManager BoardRole = "manager"
	RoleMember  BoardRole = "member"
)

// IsValid ตรวจสอบว่า Role ที่ส่งมาถูกต้องตามที่ Database รองรับหรือไม่
func (r BoardRole) IsValid() bool {
	switch r {
	case RoleOwner, RoleManager, RoleMember:
		return true
	}
	return false
}