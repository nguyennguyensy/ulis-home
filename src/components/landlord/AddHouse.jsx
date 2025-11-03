import React, { useState } from 'react';
import { MapPin, Image as ImageIcon, DollarSign, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import Map from '../shared/Map';
import ImageUpload from '../shared/ImageUpload';
import houseService from '../../services/houseService';
import { validateRequired, validatePrice } from '../../utils/validation';
import { DEFAULT_AMENITIES } from '../../utils/constants';

const AddHouse = ({ currentUser, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    location: null,
    images: [],
    price: '',
    roomType: 'single',
    costs: [],
    electricityPrice: '',
    waterPrice: '',
    amenities: []
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom costs/amenities
  const [newCost, setNewCost] = useState({ name: '', price: '', unit: '₫' });
  const [newAmenity, setNewAmenity] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleLocationSelect = (location) => {
    handleChange('location', location);
  };

  const addCost = () => {
    if (newCost.name && newCost.price && newCost.unit) {
      handleChange('costs', [...formData.costs, { ...newCost, id: Date.now() }]);
      setNewCost({ name: '', price: '', unit: '₫' });
    }
  };

  const removeCost = (id) => {
    handleChange('costs', formData.costs.filter(c => c.id !== id));
  };

  const toggleAmenity = (amenity) => {
    if (formData.amenities.includes(amenity)) {
      handleChange('amenities', formData.amenities.filter(a => a !== amenity));
    } else {
      handleChange('amenities', [...formData.amenities, amenity]);
    }
  };

  const addCustomAmenity = () => {
    if (newAmenity && !formData.amenities.includes(newAmenity)) {
      handleChange('amenities', [...formData.amenities, newAmenity]);
      setNewAmenity('');
    }
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};

    switch (stepNumber) {
      case 1:
        if (!formData.address) newErrors.address = 'Vui lòng nhập địa chỉ';
        if (!formData.location) newErrors.location = 'Vui lòng chọn vị trí trên bản đồ';
        break;
      case 2:
        if (formData.images.length === 0) newErrors.images = 'Vui lòng tải lên ít nhất 1 ảnh';
        break;
      case 3:
        const titleError = validateRequired(formData.title);
        if (titleError) newErrors.title = titleError;
        
        const priceError = validatePrice(formData.price);
        if (priceError) newErrors.price = priceError;
      // Utilities required
      const elecError = validatePrice(formData.electricityPrice);
      if (elecError) newErrors.electricityPrice = 'Vui lòng nhập giá điện (đ/kWh)';

      const waterError = validatePrice(formData.waterPrice);
      if (waterError) newErrors.waterPrice = 'Vui lòng nhập giá nước (đ/m³)';
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    try {
      await houseService.createHouse(currentUser.id, formData);
      console.log('Đăng nhà thành công!');
      onSuccess();
    } catch (error) {
      console.error('Có lỗi xảy ra. Vui lòng thử lại.', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#111827'
            }}>
              Vị trí nhà trọ
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              marginBottom: '24px'
            }}>
              Nhập địa chỉ và chọn vị trí chính xác trên bản đồ
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#374151'
              }}>
                Địa chỉ *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                rows={3}
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
              {errors.address && (
                <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
                  {errors.address}
                </p>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#374151'
              }}>
                Chọn vị trí trên bản đồ *
              </label>
              <Map
                selectedLocation={formData.location}
                onLocationSelect={handleLocationSelect}
                height="400px"
                interactive={true}
              />
              {errors.location && (
                <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
                  {errors.location}
                </p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#111827'
            }}>
              Hình ảnh nhà trọ
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              marginBottom: '24px'
            }}>
              Tải lên ít nhất 3 ảnh để thu hút sinh viên hơn
            </p>

            <ImageUpload
              images={formData.images}
              onImagesChange={(images) => handleChange('images', images)}
              maxImages={10}
            />
            {errors.images && (
              <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '8px' }}>
                {errors.images}
              </p>
            )}
          </div>
        );

      case 3:
        return (
          <div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#111827'
            }}>
              Thông tin chi tiết
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              marginBottom: '24px'
            }}>
              Cung cấp thông tin về giá cả và tiện ích
            </p>

            {/* Title */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#374151'
              }}>
                Tiêu đề *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="VD: Phòng trọ gần trường ĐHNN"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${errors.title ? '#EF4444' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              {errors.title && (
                <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#374151'
              }}>
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Mô tả về nhà trọ..."
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
            </div>

            {/* Room Type */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#374151'
              }}>
                Loại phòng
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { value: 'single', label: 'Phòng đơn' },
                  { value: 'double', label: 'Phòng đôi' },
                  { value: 'dorm', label: 'Phòng tập thể' }
                ].map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleChange('roomType', type.value)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: formData.roomType === type.value ? '#4F46E5' : 'white',
                      color: formData.roomType === type.value ? 'white' : '#374151',
                      border: `2px solid ${formData.roomType === type.value ? '#4F46E5' : '#E5E7EB'}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#374151'
              }}>
                Giá thuê (₫/tháng) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="2000000"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${errors.price ? '#EF4444' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              {errors.price && (
                <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
                  {errors.price}
                </p>
              )}
            </div>

            {/* Utilities: Electricity & Water (required) */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#374151'
              }}>
                Giá điện (đ/kWh) *
              </label>
              <input
                type="number"
                value={formData.electricityPrice}
                onChange={(e) => handleChange('electricityPrice', e.target.value)}
                placeholder="5000"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${errors.electricityPrice ? '#EF4444' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              {errors.electricityPrice && (
                <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
                  {errors.electricityPrice}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#374151'
              }}>
                Giá nước (đ/m³) *
              </label>
              <input
                type="number"
                value={formData.waterPrice}
                onChange={(e) => handleChange('waterPrice', e.target.value)}
                placeholder="20000"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${errors.waterPrice ? '#EF4444' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              {errors.waterPrice && (
                <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
                  {errors.waterPrice}
                </p>
              )}
            </div>

            {/* Additional Costs */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#374151'
              }}>
                Chi phí khác
              </label>
              
              {formData.costs.map(cost => (
                <div
                  key={cost.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{cost.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>
                      {parseInt(cost.price).toLocaleString()}{cost.unit || '₫'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCost(cost.id)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#FEE2E2',
                        color: '#EF4444',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newCost.name}
                  onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                  placeholder="Tên chi phí (VD: Điện)"
                  style={{
                    flex: 2,
                    padding: '10px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <input
                  type="number"
                  value={newCost.price}
                  onChange={(e) => setNewCost({ ...newCost, price: e.target.value })}
                  placeholder="Giá"
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <input
                  type="text"
                  value={newCost.unit}
                  onChange={(e) => setNewCost({ ...newCost, unit: e.target.value })}
                  placeholder="đ / đơn vị (VD: đ, đ/kWh, đ/m³)"
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={addCost}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#4F46E5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Thêm
                </button>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#374151'
              }}>
                Tiện ích
              </label>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '8px',
                marginBottom: '12px'
              }}>
                {DEFAULT_AMENITIES.map(amenity => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    style={{
                      padding: '10px',
                      backgroundColor: formData.amenities.includes(amenity) ? '#4F46E5' : 'white',
                      color: formData.amenities.includes(amenity) ? 'white' : '#374151',
                      border: `2px solid ${formData.amenities.includes(amenity) ? '#4F46E5' : '#E5E7EB'}`,
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {amenity}
                  </button>
                ))}
              </div>

              {/* Display selected amenities */}
              {formData.amenities.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                    Đã chọn ({formData.amenities.length}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {formData.amenities.map((amenity, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#E0E7FF',
                          color: '#4F46E5',
                          borderRadius: '16px',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() => toggleAmenity(amenity)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0',
                            color: '#4F46E5',
                            fontSize: '18px',
                            lineHeight: '1'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomAmenity();
                    }
                  }}
                  placeholder="Thêm tiện ích khác (nhấn Enter hoặc click Thêm)..."
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={addCustomAmenity}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#4F46E5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 140px)',
      backgroundColor: '#F9FAFB',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Progress Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '32px'
        }}>
          {[
            { num: 1, label: 'Vị trí', icon: MapPin },
            { num: 2, label: 'Hình ảnh', icon: ImageIcon },
            { num: 3, label: 'Chi tiết', icon: DollarSign }
          ].map((s, index) => {
            const Icon = s.icon;
            const isActive = step >= s.num;
            const isCompleted = step > s.num;

            return (
              <React.Fragment key={s.num}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted ? '#10B981' : isActive ? '#4F46E5' : '#E5E7EB',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px'
                  }}>
                    {isCompleted ? <CheckCircle size={24} /> : <Icon size={24} />}
                  </div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: isActive ? '#111827' : '#9CA3AF'
                  }}>
                    {s.label}
                  </span>
                </div>
                {index < 2 && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: step > s.num ? '#10B981' : '#E5E7EB',
                    alignSelf: 'center',
                    marginTop: '-24px',
                    maxWidth: '100px'
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Form Content */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px'
        }}>
          {renderStep()}

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid #E5E7EB'
          }}>
            {step > 1 ? (
              <button
                onClick={handlePrev}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <ArrowLeft size={18} />
                Quay lại
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                onClick={handleNext}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Tiếp tục
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isSubmitting ? '#9CA3AF' : '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle size={18} />
                {isSubmitting ? 'Đang đăng...' : 'Hoàn tất'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddHouse;