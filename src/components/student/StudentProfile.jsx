import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Edit2, Save, X } from 'lucide-react';
import authService from '../../services/authService';
import { useToast } from '../shared/ToastProvider';
import { validateEmail, validatePhone } from '../../utils/validation';

const StudentProfile = ({ currentUser, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    address: '',
    roommatePreference: ''
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (currentUser) {
      setFormData({
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        roommatePreference: currentUser.roommatePreference || ''
      });
    }
  }, [currentUser]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSave = async () => {
    // Guard: ensure we have a user id
    if (!currentUser?.id) {
      toast.show('Không xác định được người dùng. Vui lòng đăng nhập lại.', 'error');
      return;
    }
    // Validation
    const newErrors = {};
    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      // optimistic update locally: update parent UI immediately
      const updatedUser = {
        ...currentUser,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        roommatePreference: formData.roommatePreference
      };
      if (onUserUpdate) onUserUpdate(updatedUser);

      // Fail-safe timeout to prevent infinite spinner if network hangs
      const withTimeout = (promise, ms = 30000) => {
        let t;
        return Promise.race([
          promise.finally(() => clearTimeout(t)),
          new Promise((_, reject) => {
            t = setTimeout(() => {
              console.error('❌ TIMEOUT after', ms, 'ms');
              reject(new Error('TIMEOUT'));
            }, ms);
          })
        ]);
      };

      console.log('🔵 StudentProfile: Starting save with data:', {
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        roommatePreference: formData.roommatePreference
      });

      const res = await withTimeout(authService.updateUser(currentUser.id, {
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        roommatePreference: formData.roommatePreference
      }));
      
      console.log('✅ StudentProfile: Save completed, result:', res);
      setIsEditing(false);
      toast.show('Đã lưu hồ sơ thành công', 'success');
      // ensure parent has authoritative data
      if (onUserUpdate) onUserUpdate(res);
    } catch (error) {
      console.error('Có lỗi xảy ra khi lưu hồ sơ.', error);
      const msg = error?.message === 'TIMEOUT'
        ? 'Mạng chậm. Không thể lưu hồ sơ lúc này.'
        : 'Lưu hồ sơ thất bại. Vui lòng thử lại.';
      toast.show(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      address: currentUser.address || '',
      roommatePreference: currentUser.roommatePreference || ''
    });
    setErrors({});
    setIsEditing(false);
  };

  if (!currentUser) return null;

  return (
    <div style={{
      minHeight: 'calc(100vh - 140px)',
      backgroundColor: '#F9FAFB',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            color: 'white'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>
                Hồ sơ cá nhân
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Edit2 size={16} />
                  Chỉnh sửa
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      color: '#4F46E5',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Save size={16} />
                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <button
                    onClick={handleCancel}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <X size={16} />
                    Hủy
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Avatar Section */}
          <div style={{
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            borderBottom: '1px solid #E5E7EB'
          }}>
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt="Avatar"
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid #4F46E5'
                }}
              />
            ) : (
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: '#E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '4px solid #4F46E5'
              }}>
                <User size={60} color="#6B7280" />
              </div>
            )}
            <div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: '#111827'
              }}>
                {currentUser.name}
              </h3>
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Sinh viên
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div style={{ padding: '24px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#111827'
            }}>
              Thông tin cơ bản
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}>
              {/* Name - Read only */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Họ và tên
                </label>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <User size={18} />
                  {currentUser.name}
                </div>
                <span style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px', display: 'block' }}>
                  Không thể thay đổi
                </span>
              </div>

              {/* Age - Read only */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Tuổi
                </label>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#6B7280'
                }}>
                  {currentUser.age} tuổi
                </div>
                <span style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px', display: 'block' }}>
                  Không thể thay đổi
                </span>
              </div>

              {/* Email - Read only */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Email
                </label>
                {isEditing ? (
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={18}
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
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 40px',
                        border: `1px solid ${errors.email ? '#EF4444' : '#E5E7EB'}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    {errors.email && (
                      <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                        {errors.email}
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Mail size={18} />
                    {currentUser.email}
                  </div>
                )}
              </div>

              {/* Phone - Editable */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Số điện thoại
                </label>
                {isEditing ? (
                  <>
                    <div style={{ position: 'relative' }}>
                      <Phone
                        size={18}
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
                        style={{
                          width: '100%',
                          padding: '12px 12px 12px 40px',
                          border: `1px solid ${errors.phone ? '#EF4444' : '#E5E7EB'}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    {errors.phone && (
                      <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                        {errors.phone}
                      </span>
                    )}
                  </>
                ) : (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Phone size={18} />
                    {currentUser.phone}
                  </div>
                )}
              </div>

              {/* Address - Editable */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Địa chỉ
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Nhập địa chỉ"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${errors.address ? '#EF4444' : '#E5E7EB'}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                ) : (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <MapPin size={18} />
                    {currentUser.address}
                  </div>
                )}
              </div>
            </div>

            {/* Roommate Preference Section */}
            <div style={{
              marginTop: '32px',
              paddingTop: '32px',
              borderTop: '1px solid #E5E7EB'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '12px',
                color: '#111827'
              }}>
                Sở thích bạn cùng phòng
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '16px'
              }}>
                Mô tả ngắn gọn về loại bạn cùng phòng mà bạn muốn tìm (độ sạch sẽ, độ ồn, giờ sinh hoạt, sở thích...)
              </p>

              {isEditing ? (
                <textarea
                  value={formData.roommatePreference}
                  onChange={(e) => handleChange('roommatePreference', e.target.value)}
                  placeholder="Ví dụ: Tôi thích sạch sẽ, yên tĩnh, ngủ trước 23h, thích đọc sách và nghe nhạc..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              ) : (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#374151',
                  minHeight: '80px',
                  lineHeight: '1.6'
                }}>
                  {currentUser.roommatePreference || 'Chưa có thông tin'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;