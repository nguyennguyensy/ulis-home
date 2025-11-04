import React, { useState, useEffect } from 'react';
import { Save, Star, Volume2, Clock, Heart } from 'lucide-react';
import authService from '../../services/authService';
import { useToast } from '../shared/ToastProvider';
import { CLEANLINESS_LEVELS, NOISE_LEVELS, SLEEP_SCHEDULES, COMMON_HOBBIES } from '../../utils/constants';

const RoommateProfile = ({ currentUser, onUserUpdate }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    cleanliness: 3,
    noiseLevel: 3,
    sleepSchedule: '',
    hobbies: []
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser?.roommateProfile) {
      setFormData(currentUser.roommateProfile);
    }
  }, [currentUser]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleHobby = (hobby) => {
    setFormData(prev => ({
      ...prev,
      hobbies: prev.hobbies.includes(hobby)
        ? prev.hobbies.filter(h => h !== hobby)
        : [...prev.hobbies, hobby]
    }));
  };

  const handleSave = async () => {
    if (!currentUser?.id) {
      toast.show('Không xác định được người dùng. Vui lòng đăng nhập lại.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // Generate preference text
      const cleanlinessText = CLEANLINESS_LEVELS.find(l => l.value === formData.cleanliness)?.label || 'Không xác định';
      const noiseText = NOISE_LEVELS.find(l => l.value === formData.noiseLevel)?.label || 'Không xác định';
      
      const preferenceText = `Độ sạch sẽ: ${cleanlinessText}. Độ ồn: ${noiseText}. Giờ ngủ: ${formData.sleepSchedule || 'Không xác định'}. Sở thích: ${formData.hobbies.join(', ') || 'Chưa có'}.`;

      console.log('🔵 RoommateProfile: Saving with data:', {
        roommateProfile: formData,
        roommatePreference: preferenceText
      });

      const updatedUser = await authService.updateUser(currentUser.id, {
        roommateProfile: formData,
        roommatePreference: preferenceText
      });

      console.log('✅ RoommateProfile: Save completed');
      
      // Update parent component
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      toast.show('Đã lưu hồ sơ roommate!', 'success');
    } catch (error) {
      console.error('❌ RoommateProfile: Save failed', error);
      toast.show('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

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
          padding: '32px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Hồ sơ tìm bạn cùng phòng
              </h2>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                Thông tin này sẽ giúp bạn tìm được roommate phù hợp hơn
              </p>
            </div>
          </div>

          {/* Cleanliness Level */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#111827'
            }}>
              <Star size={20} color="#4F46E5" />
              Độ sạch sẽ
            </label>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              marginBottom: '12px'
            }}>
              Bạn thích môi trường sống như thế nào?
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CLEANLINESS_LEVELS.map(level => (
                <button
                  key={level.value}
                  onClick={() => handleChange('cleanliness', level.value)}
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    padding: '12px',
                    backgroundColor: formData.cleanliness === level.value ? '#4F46E5' : 'white',
                    color: formData.cleanliness === level.value ? 'white' : '#374151',
                    border: `2px solid ${formData.cleanliness === level.value ? '#4F46E5' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (formData.cleanliness !== level.value) {
                      e.currentTarget.style.borderColor = '#4F46E5';
                      e.currentTarget.style.backgroundColor = '#EEF2FF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.cleanliness !== level.value) {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Noise Level */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#111827'
            }}>
              <Volume2 size={20} color="#4F46E5" />
              Độ ồn chấp nhận được
            </label>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              marginBottom: '12px'
            }}>
              Mức độ yên tĩnh bạn mong muốn?
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {NOISE_LEVELS.map(level => (
                <button
                  key={level.value}
                  onClick={() => handleChange('noiseLevel', level.value)}
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    padding: '12px',
                    backgroundColor: formData.noiseLevel === level.value ? '#4F46E5' : 'white',
                    color: formData.noiseLevel === level.value ? 'white' : '#374151',
                    border: `2px solid ${formData.noiseLevel === level.value ? '#4F46E5' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (formData.noiseLevel !== level.value) {
                      e.currentTarget.style.borderColor = '#4F46E5';
                      e.currentTarget.style.backgroundColor = '#EEF2FF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.noiseLevel !== level.value) {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sleep Schedule */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#111827'
            }}>
              <Clock size={20} color="#4F46E5" />
              Giờ sinh hoạt
            </label>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              marginBottom: '12px'
            }}>
              Thời gian bạn thường đi ngủ?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {SLEEP_SCHEDULES.map(schedule => (
                <button
                  key={schedule}
                  onClick={() => handleChange('sleepSchedule', schedule)}
                  style={{
                    padding: '12px',
                    backgroundColor: formData.sleepSchedule === schedule ? '#4F46E5' : 'white',
                    color: formData.sleepSchedule === schedule ? 'white' : '#374151',
                    border: `2px solid ${formData.sleepSchedule === schedule ? '#4F46E5' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (formData.sleepSchedule !== schedule) {
                      e.currentTarget.style.borderColor = '#4F46E5';
                      e.currentTarget.style.backgroundColor = '#EEF2FF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.sleepSchedule !== schedule) {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {schedule}
                </button>
              ))}
            </div>
          </div>

          {/* Hobbies */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#111827'
            }}>
              <Heart size={20} color="#4F46E5" />
              Sở thích
            </label>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              marginBottom: '12px'
            }}>
              Chọn các sở thích của bạn (có thể chọn nhiều)
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '8px'
            }}>
              {COMMON_HOBBIES.map(hobby => (
                <button
                  key={hobby}
                  onClick={() => toggleHobby(hobby)}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: formData.hobbies.includes(hobby) ? '#4F46E5' : 'white',
                    color: formData.hobbies.includes(hobby) ? 'white' : '#374151',
                    border: `2px solid ${formData.hobbies.includes(hobby) ? '#4F46E5' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!formData.hobbies.includes(hobby)) {
                      e.currentTarget.style.borderColor = '#4F46E5';
                      e.currentTarget.style.backgroundColor = '#EEF2FF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!formData.hobbies.includes(hobby)) {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {hobby}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: isSaving ? '#9CA3AF' : '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isSaving) e.currentTarget.style.backgroundColor = '#4338CA';
            }}
            onMouseLeave={(e) => {
              if (!isSaving) e.currentTarget.style.backgroundColor = '#4F46E5';
            }}
          >
            <Save size={20} />
            {isSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}
          </button>

          {/* Info Box */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#EEF2FF',
            borderRadius: '8px',
            border: '1px solid #C7D2FE'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#4338CA',
              lineHeight: '1.6'
            }}>
              💡 <strong>Mẹo:</strong> Hồ sơ chi tiết sẽ giúp bạn tìm được roommate phù hợp hơn. 
              Thông tin này sẽ hiển thị cho các sinh viên khác khi họ xem phòng đôi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoommateProfile;