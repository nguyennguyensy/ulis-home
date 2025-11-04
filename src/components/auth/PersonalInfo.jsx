import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, CreditCard, Upload, Camera, Clock } from 'lucide-react';
import authService from '../../services/authService';
import { validatePhone, validateIdCard, validateRequired, validateAge } from '../../utils/validation';

const PROFILE_COMPLETION_TIMEOUT = 10 * 60 * 1000; // 10 minutes

function PersonalInfo({ user, onComplete }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    address: '',
    idCard: '',
    avatar: null
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [remainingTime, setRemainingTime] = useState(PROFILE_COMPLETION_TIMEOUT);

  useEffect(() => {
    // Check if user creation time is available
    if (!user?.createdAt) return;

    const createdAt = new Date(user.createdAt).getTime();
    const elapsed = Date.now() - createdAt;

    // If already timed out
    if (elapsed >= PROFILE_COMPLETION_TIMEOUT) {
      handleTimeout();
      return;
    }

    // Update remaining time every second
    const interval = setInterval(() => {
      const newElapsed = Date.now() - createdAt;
      const newRemaining = PROFILE_COMPLETION_TIMEOUT - newElapsed;

      if (newRemaining <= 0) {
        handleTimeout();
      } else {
        setRemainingTime(newRemaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const handleTimeout = async () => {
    setIsTimedOut(true);
    try {
      // Delete the incomplete user account
      await authService.deleteIncompleteUser(user.id);
      await authService.logout();
    } catch (error) {
      console.error('Failed to delete incomplete user:', error);
    }
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, avatar: 'Vui lòng chọn file ảnh' }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        handleChange('avatar', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    
    const nameError = validateRequired(formData.name);
    if (nameError) newErrors.name = nameError;

    const ageError = validateAge(formData.age);
    if (ageError) newErrors.age = ageError;

    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    const addressError = validateRequired(formData.address);
    if (addressError) newErrors.address = addressError;

    const idCardError = validateIdCard(formData.idCard);
    if (idCardError) newErrors.idCard = idCardError;

    if (!formData.avatar) {
      newErrors.avatar = 'Vui lòng tải lên ảnh đại diện';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      console.log('📤 Submitting profile data:', {
        userId: user.id,
        name: formData.name,
        age: parseInt(formData.age),
        phone: formData.phone,
        address: formData.address,
        idCard: formData.idCard,
        hasAvatar: !!formData.avatar
      });

      const updatedUser = await authService.completeProfile(user.id, {
        name: formData.name,
        age: parseInt(formData.age),
        phone: formData.phone,
        address: formData.address,
        idCard: formData.idCard,
        avatar: formData.avatar
      });
      
      console.log('✅ Profile completed:', updatedUser);
      onComplete(updatedUser);
    } catch (error) {
      console.error('❌ Profile completion error:', error);
      setErrors({ general: `Có lỗi xảy ra: ${error.message || 'Vui lòng thử lại.'}` });
    } finally {
      setIsLoading(false);
    }
  };

  // If timed out, show timeout message
  if (isTimedOut) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <Clock size={64} color="#EF4444" style={{ margin: '0 auto 24px' }} />
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: '#111827'
        }}>
          Hết thời gian hoàn thiện hồ sơ
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#6B7280',
          marginBottom: '24px',
          lineHeight: '1.6'
        }}>
          Tài khoản của bạn đã bị xóa do không hoàn thiện hồ sơ trong thời gian quy định (10 phút).
          <br /><br />
          Vui lòng đăng ký lại để tạo tài khoản mới.
        </p>
        <button
          onClick={() => window.location.href = '/auth'}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Quay lại đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '40px',
      borderRadius: '16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      {/* Timer Warning */}
      {remainingTime < 3 * 60 * 1000 && (
        <div style={{
          padding: '12px',
          backgroundColor: '#FEF3C7',
          color: '#92400E',
          borderRadius: '8px',
          fontSize: '14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Clock size={18} />
          Còn {formatTime(remainingTime)} để hoàn thiện hồ sơ
        </div>
      )}

      <h2 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#111827'
      }}>
        Hoàn thiện hồ sơ
      </h2>
      <p style={{
        fontSize: '14px',
        color: '#6B7280',
        marginBottom: '32px'
      }}>
        Vui lòng cung cấp đầy đủ thông tin để hoàn tất đăng ký.
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
        {/* Avatar Upload */}
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '12px',
            color: '#374151'
          }}>
            Ảnh đại diện *
          </label>
          <div style={{
            display: 'inline-block',
            position: 'relative'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: '#F3F4F6',
              border: `2px solid ${errors.avatar ? '#EF4444' : '#E5E7EB'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              cursor: 'pointer'
            }} onClick={() => document.getElementById('avatar-input').click()}>
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Avatar preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <Camera size={40} color="#9CA3AF" />
              )}
            </div>
            <button
              type="button"
              onClick={() => document.getElementById('avatar-input').click()}
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#4F46E5',
                color: 'white',
                border: '2px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Upload size={18} />
            </button>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>
          {errors.avatar && (
            <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '8px' }}>
              {errors.avatar}
            </p>
          )}
        </div>

        {/* Name */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#374151'
          }}>
            Họ và tên *
          </label>
          <div style={{ position: 'relative' }}>
            <User
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
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nguyễn Văn A"
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                border: `1px solid ${errors.name ? '#EF4444' : '#E5E7EB'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                if (!errors.name) e.target.style.borderColor = '#4F46E5';
              }}
              onBlur={(e) => {
                if (!errors.name) e.target.style.borderColor = '#E5E7EB';
              }}
            />
          </div>
          {errors.name && (
            <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
              {errors.name}
            </p>
          )}
        </div>

        {/* Age */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#374151'
          }}>
            Tuổi *
          </label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => handleChange('age', e.target.value)}
            placeholder="18"
            min="18"
            max="100"
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${errors.age ? '#EF4444' : '#E5E7EB'}`,
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              if (!errors.age) e.target.style.borderColor = '#4F46E5';
            }}
            onBlur={(e) => {
              if (!errors.age) e.target.style.borderColor = '#E5E7EB';
            }}
          />
          {errors.age && (
            <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
              {errors.age}
            </p>
          )}
        </div>

        {/* Phone */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#374151'
          }}>
            Số điện thoại *
          </label>
          <div style={{ position: 'relative' }}>
            <Phone
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
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="0912345678"
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                border: `1px solid ${errors.phone ? '#EF4444' : '#E5E7EB'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                if (!errors.phone) e.target.style.borderColor = '#4F46E5';
              }}
              onBlur={(e) => {
                if (!errors.phone) e.target.style.borderColor = '#E5E7EB';
              }}
            />
          </div>
          {errors.phone && (
            <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
              {errors.phone}
            </p>
          )}
        </div>

        {/* Address */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#374151'
          }}>
            Địa chỉ *
          </label>
          <div style={{ position: 'relative' }}>
            <MapPin
              size={20}
              style={{
                position: 'absolute',
                left: '12px',
                top: '12px',
                color: '#9CA3AF'
              }}
            />
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
              rows={3}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                border: `1px solid ${errors.address ? '#EF4444' : '#E5E7EB'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              onFocus={(e) => {
                if (!errors.address) e.target.style.borderColor = '#4F46E5';
              }}
              onBlur={(e) => {
                if (!errors.address) e.target.style.borderColor = '#E5E7EB';
              }}
            />
          </div>
          {errors.address && (
            <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
              {errors.address}
            </p>
          )}
        </div>

        {/* ID Card */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#374151'
          }}>
            Số căn cước công dân *
          </label>
          <div style={{ position: 'relative' }}>
            <CreditCard
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
              type="text"
              value={formData.idCard}
              onChange={(e) => handleChange('idCard', e.target.value)}
              placeholder="001234567890"
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                border: `1px solid ${errors.idCard ? '#EF4444' : '#E5E7EB'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                if (!errors.idCard) e.target.style.borderColor = '#4F46E5';
              }}
              onBlur={(e) => {
                if (!errors.idCard) e.target.style.borderColor = '#E5E7EB';
              }}
            />
          </div>
          {errors.idCard && (
            <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
              {errors.idCard}
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
          {isLoading ? 'Đang xử lý...' : 'Hoàn tất'}
        </button>
      </form>

      <p style={{
        fontSize: '12px',
        color: '#6B7280',
        marginTop: '16px',
        textAlign: 'center'
      }}>
        * Các trường này là bắt buộc
      </p>
    </div>
  );
};

export default PersonalInfo;