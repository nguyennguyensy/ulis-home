import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Edit2, Save, X } from 'lucide-react';
import authService from '../../services/authService';
import { useToast } from '../shared/ToastProvider';
import { validateEmail, validatePhone } from '../../utils/validation';

const LandlordProfile = ({ currentUser, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    address: ''
  });
  const [originalData, setOriginalData] = useState({
    email: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (currentUser) {
      const data = {
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || ''
      };
      setFormData(data);
      setOriginalData(data);
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
      const updatedUser = {
        ...currentUser,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
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

      console.log('🔵 LandlordProfile: Starting save with data:', {
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      });

      const res = await withTimeout(authService.updateUser(currentUser.id, {
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      }));
      
      console.log('✅ LandlordProfile: Save completed, result:', res);
      
      // Update originalData to reflect the new saved state
      setOriginalData({
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      });
      
      setIsEditing(false);
      toast.show('Đã lưu hồ sơ thành công', 'success');
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
    setFormData(originalData);
    setErrors({});
    setIsEditing(false);
  };

  const isFieldChanged = (field) => {
    return isEditing && formData[field] !== originalData[field];
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
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
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
                      color: '#10B981',
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
                  border: '4px solid #10B981'
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
                border: '4px solid #10B981'
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
                backgroundColor: '#D1FAE5',
                color: '#10B981',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Chủ nhà
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

              {/* Email - Editable */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Email
                  {isFieldChanged('email') && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '12px',
                      color: '#F59E0B',
                      fontWeight: '600'
                    }}>
                      ● Đã thay đổi
                    </span>
                  )}
                </label>
                {isEditing ? (
                  <>
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
                          border: `2px solid ${errors.email ? '#EF4444' : isFieldChanged('email') ? '#F59E0B' : '#E5E7EB'}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          backgroundColor: isFieldChanged('email') ? '#FFFBEB' : 'white'
                        }}
                      />
                    </div>
                    {errors.email && (
                      <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                        {errors.email}
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
                  {isFieldChanged('phone') && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '12px',
                      color: '#F59E0B',
                      fontWeight: '600'
                    }}>
                      ● Đã thay đổi
                    </span>
                  )}
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
                          border: `2px solid ${errors.phone ? '#EF4444' : isFieldChanged('phone') ? '#F59E0B' : '#E5E7EB'}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          backgroundColor: isFieldChanged('phone') ? '#FFFBEB' : 'white'
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
                  {isFieldChanged('address') && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '12px',
                      color: '#F59E0B',
                      fontWeight: '600'
                    }}>
                      ● Đã thay đổi
                    </span>
                  )}
                </label>
                {isEditing ? (
                  <>
                    <div style={{ position: 'relative' }}>
                      <MapPin
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
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 12px 12px 40px',
                          border: `2px solid ${errors.address ? '#EF4444' : isFieldChanged('address') ? '#F59E0B' : '#E5E7EB'}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          backgroundColor: isFieldChanged('address') ? '#FFFBEB' : 'white'
                        }}
                      />
                    </div>
                    {errors.address && (
                      <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                        {errors.address}
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
                    <MapPin size={18} />
                    {currentUser.address}
                  </div>
                )}
              </div>
            </div>

            {/* Stats Section */}
            <div style={{
              marginTop: '32px',
              paddingTop: '32px',
              borderTop: '1px solid #E5E7EB'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#111827'
              }}>
                Thông tin liên hệ
              </h3>
              <div style={{
                padding: '16px',
                backgroundColor: '#D1FAE5',
                borderRadius: '8px',
                border: '1px solid #A7F3D0'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#065F46',
                  lineHeight: '1.6'
                }}>
                  📞 Số điện thoại của bạn sẽ hiển thị cho sinh viên khi họ xem chi tiết nhà. 
                  Hãy đảm bảo thông tin liên hệ luôn chính xác để sinh viên có thể liên hệ với bạn dễ dàng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandlordProfile;