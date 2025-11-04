# Logic Quản Lý Đặt Phòng

## Quy Tắc Chính

### 1. Giới Hạn Đặt Phòng
- **Tối đa số người đặt phòng** = `maxOccupants × 5`
- Ví dụ:
  - Phòng đơn (`maxOccupants = 1`): tối đa 5 người đặt
  - Phòng đôi (`maxOccupants = 2`): tối đa 10 người đặt
  - Phòng ký túc xá (`maxOccupants = 4`): tối đa 20 người đặt

### 2. Duyệt Đặt Phòng
Khi chủ nhà **duyệt** (approve) một đặt phòng:
1. Kiểm tra xem phòng còn chỗ không (`currentOccupants < maxOccupants`)
2. Nếu còn chỗ:
   - Tăng `currentOccupants` lên 1
   - Cập nhật trạng thái reservation thành `approved`
3. Nếu đủ người (`currentOccupants >= maxOccupants`):
   - Đánh dấu phòng `isAvailable = false`
   - **TỰ ĐỘNG** chuyển TẤT CẢ reservation `pending` còn lại thành `waitlist`

### 3. Hủy Duyệt
Khi chủ nhà thay đổi từ **approved** sang **rejected** hoặc **waitlist**:
1. Giảm `currentOccupants` xuống 1
2. Nếu phòng đang đánh dấu đầy (`isAvailable = false`):
   - Đánh dấu lại `isAvailable = true` (có chỗ trống)

### 4. Xóa Reservation
Khi sinh viên xóa reservation đã được duyệt:
1. Giảm `currentOccupants` xuống 1
2. Phòng lại có chỗ trống

## Các Trạng Thái Reservation

1. **pending**: Chờ chủ nhà xem xét (mới đặt)
2. **approved**: Đã được duyệt (đếm vào `currentOccupants`)
3. **waitlist**: Danh sách chờ (phòng đã đầy)
4. **rejected**: Bị từ chối
5. **expired**: Hết hạn (sau 7 ngày)

## Flow Diagram

```
Sinh viên đặt phòng
    ↓
[PENDING]
    ↓
Chủ nhà duyệt → [APPROVED] → currentOccupants++
    ↓                              ↓
    ↓                    Đủ người? (currentOccupants >= maxOccupants)
    ↓                              ↓
    ↓                            YES → Chuyển tất cả PENDING → WAITLIST
    ↓                              ↓
    ↓                            NO → Tiếp tục nhận đặt phòng
    ↓
Chủ nhà từ chối/chờ → [REJECTED/WAITLIST]
    ↓
Nếu từ APPROVED → currentOccupants--
    ↓
Phòng lại có chỗ trống
```

## Ví Dụ: Phòng Đôi (maxOccupants = 2)

### Tình huống:
- Có 10 sinh viên đặt phòng đôi (5 × 2 = 10 người)

### Timeline:
1. **10 sinh viên đặt phòng** → 10 reservations ở trạng thái `pending`
2. Chủ nhà duyệt sinh viên A → `currentOccupants = 1`, 9 reservations còn `pending`
3. Chủ nhà duyệt sinh viên B → `currentOccupants = 2` (ĐẦY!)
   - `isAvailable = false`
   - **8 reservations còn lại tự động → `waitlist`**
4. Sinh viên A hủy đặt phòng → `currentOccupants = 1`
   - `isAvailable = true`
   - Chủ nhà có thể duyệt từ danh sách chờ (8 người)

## Code Implementation

Xem file: `backend/src/routes/reservations.js`
- Dòng 116-170: Logic update reservation status
- Dòng 126-156: Logic approve reservation
- Dòng 159-169: Logic un-approve reservation
