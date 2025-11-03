import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import authService from '../../services/authService';
import { validateEmail } from '../../utils/validation';

function Login({ onSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;
    if (!password) newErrors.password = 'Vui lòng nhập mật khẩu';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const user = await authService.login(email, password);
      onSuccess(user);
    } catch (error) {
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        setErrors({ 
          general: 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư và xác thực email trước khi đăng nhập.' 
        });
      } else {
        setErrors({ general: error.message });
      }
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
        Đăng nhập
      </h2>
      <p style={{
        fontSize: '14px',
        color: '#6B7280',
        marginBottom: '32px'
      }}>
        Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.
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
        {/* Email */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#374151'
          }}>
            Email
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
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
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
        <div style={{ marginBottom: '24px' }}>
          <label style={{
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
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      {/* Switch to Register */}
      <div style={{
        marginTop: '24px',
        textAlign: 'center',
        fontSize: '14px'
      }}>
        <span style={{ color: '#6B7280' }}>Chưa có tài khoản? </span>
        <button
          onClick={onSwitchToRegister}
          style={{
            color: '#4F46E5',
            fontWeight: '600',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Đăng ký ngay
        </button>
      </div>
    </div>
  );
};

export default Login;