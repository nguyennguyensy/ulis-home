// Reservation status
export const RESERVATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  WAITLIST: 'waitlist'
};

// Reservation duration in days
export const RESERVATION_DURATION = 7;

// Room types
export const ROOM_TYPES = {
  SINGLE: 'single',
  DOUBLE: 'double',
  DORM: 'dorm'
};

// Default amenities
export const DEFAULT_AMENITIES = [
  'Bếp',
  'Máy giặt',
  'Điều hòa',
  'Nóng lạnh',
  'WiFi',
  'Tủ lạnh',
  'Ban công',
  'Chỗ để xe',
  'Bảo vệ 24/7',
  'Camera an ninh'
];

// Roommate preferences options
export const CLEANLINESS_LEVELS = [
  { value: 1, label: 'Rất lộn xộn' },
  { value: 2, label: 'Hơi lộn xộn' },
  { value: 3, label: 'Trung bình' },
  { value: 4, label: 'Khá sạch sẽ' },
  { value: 5, label: 'Rất sạch sẽ' }
];

export const NOISE_LEVELS = [
  { value: 1, label: 'Rất ồn' },
  { value: 2, label: 'Hơi ồn' },
  { value: 3, label: 'Vừa phải' },
  { value: 4, label: 'Yên tĩnh' },
  { value: 5, label: 'Rất yên tĩnh' }
];

export const SLEEP_SCHEDULES = [
  'Ngủ sớm (trước 22h)',
  'Trung bình (22h-24h)',
  'Muộn (sau 24h)',
  'Không cố định'
];

export const COMMON_HOBBIES = [
  'Đọc sách',
  'Xem phim',
  'Nghe nhạc',
  'Chơi game',
  'Thể thao',
  'Nấu ăn',
  'Du lịch',
  'Nhiếp ảnh',
  'Vẽ',
  'Nhảy',
  'Ca hát'
];

// Map default center (ULIS location)
export const MAP_CENTER = {
  lat: 21.0285,
  lng: 105.8542
};

export const MAP_ZOOM = 13;

// Validation patterns
export const PATTERNS = {
  EMAIL_EDU: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu\.vn$/,
  PHONE: /^(0|\+84)[0-9]{9,10}$/,
  ID_CARD: /^[0-9]{9,12}$/
};

// Error messages
export const ERROR_MESSAGES = {
  REQUIRED: 'Trường này là bắt buộc',
  INVALID_EMAIL: 'Email không hợp lệ',
  INVALID_EMAIL_EDU: 'Sinh viên phải sử dụng email trường có đuôi .edu.vn',
  INVALID_PHONE: 'Số điện thoại không hợp lệ',
  INVALID_ID_CARD: 'Số căn cước không hợp lệ',
  PASSWORD_MISMATCH: 'Mật khẩu không khớp',
  PASSWORD_MIN_LENGTH: 'Mật khẩu phải có ít nhất 6 ký tự',
  LOGIN_FAILED: 'Email hoặc mật khẩu không đúng',
  REGISTER_FAILED: 'Đăng ký thất bại',
  AGE_MIN: 'Tuổi phải từ 18 trở lên',
  PRICE_MIN: 'Giá phải lớn hơn 0'
};

// Success messages
export const SUCCESS_MESSAGES = {
  REGISTER_SUCCESS: 'Đăng ký thành công',
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  UPDATE_SUCCESS: 'Cập nhật thành công',
  DELETE_SUCCESS: 'Xóa thành công',
  RESERVE_SUCCESS: 'Đặt phòng thành công',
  UNRESERVE_SUCCESS: 'Hủy đặt phòng thành công',
  APPROVE_SUCCESS: 'Duyệt thành công',
  REJECT_SUCCESS: 'Từ chối thành công'
};