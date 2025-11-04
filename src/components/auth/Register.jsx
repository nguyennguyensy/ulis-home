import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import authService from '../../services/authService';
import { validateEmail } from '../../utils/validation';
import { AUTH_ERRORS, AUTH_PATTERNS } from '../../utils/authConstants.js';

// Define validation functions using auth constants
const validateEmailEdu = (email) => {
  if (!email) return AUTH_ERRORS.REQUIRED;
  if (!AUTH_PATTERNS.EMAIL_EDU.test(email)) return AUTH_ERRORS.INVALID_EMAIL_EDU;
  return null;
};

const validatePassword = (password) => {
  if (!password) return AUTH_ERRORS.REQUIRED;
  if (password.length < 6) return AUTH_ERRORS.PASSWORD_MIN_LENGTH;
  return null;
};

const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return AUTH_ERRORS.REQUIRED;
  if (password !== confirmPassword) return AUTH_ERRORS.PASSWORD_MISMATCH;
  return null;
};

// Define role constants
const ROLE_TYPES = {
  STUDENT: 'student',
  LANDLORD: 'landlord'
};

function Register({ onSuccess, onSwitchToLogin }) {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(ROLE_TYPES.STUDENT)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    
    if (role === ROLE_TYPES.STUDENT) {
      const emailError = validateEmailEdu(email);
      if (emailError) newErrors.email = emailError;
    } else {
      const emailError = validateEmail(email);
      if (emailError) newErrors.email = emailError;
    }
    
    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;
    
    const confirmPasswordError = validateConfirmPassword(password, confirmPassword);
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const user = await authService.register(email, password, role);
      onSuccess(user);
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '40px',
      borderRadius: '16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }}>
      <h2 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#111827'
      }}>
        Đăng ký
      </h2>
      <p style={{
        fontSize: '14px',
        color: '#6B7280',
        marginBottom: '32px'
      }}>
        Tạo tài khoản mới để bắt đầu sử dụng ULIS HOME.
      </p>

      {errors.general && (
        <div style={{
          padding: '12px',
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
          borderRadius: '8px',
          fontSize: '14px',
          marginBottom: '20px'
        }}>
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Role Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label 
            htmlFor="role-group"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#374151'
            }}>
            Bạn là
          </label>
          <div id="role-group" role="group" aria-label="Lựa chọn vai trò" style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              role="radio"
              aria-checked={role === ROLE_TYPES.STUDENT}
              onClick={() => setRole(ROLE_TYPES.STUDENT)}
              style={{
                flex: 1,
                padding: '12px',
                border: `2px solid ${role === ROLE_TYPES.STUDENT ? '#4F46E5' : '#E5E7EB'}`,
                backgroundColor: role === ROLE_TYPES.STUDENT ? '#EEF2FF' : 'white',
                color: role === ROLE_TYPES.STUDENT ? '#4F46E5' : '#6B7280',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Sinh viên
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={role === ROLE_TYPES.LANDLORD}
              onClick={() => setRole(ROLE_TYPES.LANDLORD)}
              style={{
                flex: 1,
                padding: '12px',
                border: `2px solid ${role === ROLE_TYPES.LANDLORD ? '#4F46E5' : '#E5E7EB'}`,
                backgroundColor: role === ROLE_TYPES.LANDLORD ? '#EEF2FF' : 'white',
                color: role === ROLE_TYPES.LANDLORD ? '#4F46E5' : '#6B7280',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Chủ nhà
            </button>
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: '20px' }}>
          <label 
            htmlFor="email"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#374151'
            }}>
            Email {role === ROLE_TYPES.STUDENT && '(Email trường)'}
          </label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={20}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF'
              }}
            />
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === ROLE_TYPES.STUDENT ? 'your.name@university.edu.vn' : 'your.email@example.com'}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                border: `1px solid ${errors.email ? '#EF4444' : '#E5E7EB'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                if (!errors.email) e.target.style.borderColor = '#4F46E5';
              }}
              onBlur={(e) => {
                if (!errors.email) e.target.style.borderColor = '#E5E7EB';
              }}
            />
          </div>
          {errors.email && (
            <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div style={{ marginBottom: '20px' }}>
          <label 
            htmlFor="password"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#374151'
            }}>
            Mật khẩu
          </label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={20}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF'
              }}
            />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 44px 12px 44px',
                border: `1px solid ${errors.password ? '#EF4444' : '#E5E7EB'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                if (!errors.password) e.target.style.borderColor = '#4F46E5';
              }}
              onBlur={(e) => {
                if (!errors.password) e.target.style.borderColor = '#E5E7EB';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9CA3AF',
                padding: '4px'
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: '24px' }}>
          <label 
            htmlFor="confirmPassword"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#374151'
            }}>
            Xác nhận mật khẩu
          </label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={20}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF'
              }}
            />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 44px 12px 44px',
                border: `1px solid ${errors.confirmPassword ? '#EF4444' : '#E5E7EB'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                if (!errors.confirmPassword) e.target.style.borderColor = '#4F46E5';
              }}
              onBlur={(e) => {
                if (!errors.confirmPassword) e.target.style.borderColor = '#E5E7EB';
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9CA3AF',
                padding: '4px'
              }}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isLoading ? '#9CA3AF' : '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) e.target.style.backgroundColor = '#4338CA';
          }}
          onMouseLeave={(e) => {
            if (!isLoading) e.target.style.backgroundColor = '#4F46E5';
          }}
        >
          {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>

      {/* Switch to Login */}
      <div style={{
        marginTop: '24px',
        textAlign: 'center',
        fontSize: '14px'
      }}>
        <span style={{ color: '#6B7280' }}>Đã có tài khoản? </span>
        <button
          onClick={onSwitchToLogin}
          style={{
            color: '#4F46E5',
            fontWeight: '600',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Đăng nhập ngay
        </button>
      </div>
    </div>
  );
};

export default Register;