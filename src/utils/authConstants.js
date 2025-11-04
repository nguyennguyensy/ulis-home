// User roles
export const ROLES = {
  STUDENT: 'student',
  LANDLORD: 'landlord'
};

// Auth-related error messages
export const AUTH_ERRORS = {
  REQUIRED: 'Trường này là bắt buộc',
  INVALID_EMAIL: 'Email không hợp lệ',
  INVALID_EMAIL_EDU: 'Sinh viên phải sử dụng email trường có đuôi .edu.vn',
  INVALID_PHONE: 'Số điện thoại không hợp lệ',
  INVALID_ID_CARD: 'Số căn cước công dân không hợp lệ',
  PASSWORD_MISMATCH: 'Mật khẩu không khớp',
  PASSWORD_MIN_LENGTH: 'Mật khẩu phải có ít nhất 6 ký tự',
  AGE_MIN: 'Tuổi phải từ 18 trở lên',
  LOGIN_FAILED: 'Email hoặc mật khẩu không đúng',
  REGISTER_FAILED: 'Đăng ký thất bại'
};

// Auth-related validation patterns
export const AUTH_PATTERNS = {
  EMAIL_EDU: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu\.vn$/,
  PHONE: /^(0|\+84)[0-9]{9,10}$/,
  ID_CARD: /^[0-9]{9,12}$/
};