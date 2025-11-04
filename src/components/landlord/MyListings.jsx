import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin, Star, Trash2, Users, Check, X, Eye, Edit, Save, XCircle, Clock } from 'lucide-react';
import houseService from '../../services/houseService';
import authService from '../../services/authService';
import { RESERVATION_STATUS } from '../../utils/constants';
import ImageUpload from '../shared/ImageUpload';

const MyListings = ({ currentUser }) => {
  const navigate = useNavigate();
  const [houses, setHouses] = useState([]);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [studentsMap, setStudentsMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'reservations', 'detail', 'edit'
  const [editFormData, setEditFormData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const userId = currentUser?.id;

  const loadHouses = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!userId) return;
      const landlordHouses = await houseService.getHousesByLandlord(userId);
      setHouses(landlordHouses);
    } catch (error) {
      console.error('Error loading houses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // Wait until currentUser is available before loading houses
    if (!userId) return;
    loadHouses();
  }, [loadHouses, userId]);

  const loadReservations = async (houseId) => {
    try {
      const houseReservations = await houseService.getHouseReservations(houseId);
      setReservations(houseReservations);

      // Load student info
      const students = {};
      for (const reservation of houseReservations) {
        if (!students[reservation.studentId]) {
          const student = await authService.getUser(reservation.studentId);
          if (student) {
            students[reservation.studentId] = student;
          }
        }
      }
      setStudentsMap(students);
    } catch (error) {
      console.error('Error loading reservations:', error);
    }
  };

  const handleViewReservations = (house) => {
    setSelectedHouse(house);
    setViewMode('reservations');
    loadReservations(house.id);
  };

  const handleViewDetail = (house) => {
    setSelectedHouse(house);
    setViewMode('detail');
  };

  const handleEditHouse = (house) => {
    setSelectedHouse(house);
    
    // Extract electricity and water prices from costs
    const electricityCost = house.costs?.find(c => c.name === 'Điện');
    const waterCost = house.costs?.find(c => c.name === 'Nước');
    const otherCosts = house.costs?.filter(c => c.name !== 'Điện' && c.name !== 'Nước') || [];
    
    setEditFormData({
      title: house.title || '',
      address: house.address || '',
      price: house.price || '',
      description: house.description || '',
      roomType: house.roomType || 'single',
      electricityPrice: electricityCost?.price || '',
      waterPrice: waterCost?.price || '',
      amenities: house.amenities || [],
      costs: otherCosts,
      images: house.images || []
    });
    setViewMode('edit');
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      // Combine electricity, water, and other costs
      const allCosts = [];
      if (editFormData.electricityPrice) {
        allCosts.push({ name: 'Điện', price: Number(editFormData.electricityPrice), unit: '₫/kWh' });
      }
      if (editFormData.waterPrice) {
        allCosts.push({ name: 'Nước', price: Number(editFormData.waterPrice), unit: '₫/m³' });
      }
      allCosts.push(...editFormData.costs);

      const updateData = {
        ...editFormData,
        costs: allCosts
      };
      
      const updatedHouse = await houseService.updateHouse(selectedHouse.id, updateData);
      await loadHouses();
      
      // Update selectedHouse with new data
      setSelectedHouse(updatedHouse);
      setViewMode('detail');
      console.log('✅ Đã cập nhật thông tin nhà!');
    } catch (error) {
      console.error('Có lỗi xảy ra. Vui lòng thử lại.', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditFormData(null);
    setViewMode('detail');
  };

  const handleBack = () => {
    setSelectedHouse(null);
    setEditFormData(null);
    setViewMode('list');
  };

  const handleDeleteHouse = async (houseId) => {
      // Removed native confirm modal; proceed directly to delete (no browser blocking dialog)

    try {
      await houseService.deleteHouse(houseId);
      await loadHouses();
      setSelectedHouse(null);
        console.log('Đã xóa nhà thành công!');
    } catch (error) {
        console.error('Có lỗi xảy ra. Vui lòng thử lại.', error);
    }
  };

  const handleApproveReservation = async (reservationId) => {
    try {
      await houseService.updateReservationStatus(reservationId, RESERVATION_STATUS.APPROVED);
      await loadReservations(selectedHouse.id);
      console.log('Đã duyệt đặt phòng!');
    } catch (error) {
      console.error('Có lỗi xảy ra. Vui lòng thử lại.', error);
    }
  };

  const handleRejectReservation = async (reservationId) => {
  // Removed blocking confirm dialog; proceed to reject immediately

    try {
      await houseService.updateReservationStatus(reservationId, RESERVATION_STATUS.REJECTED);
      await loadReservations(selectedHouse.id);
      console.log('Đã từ chối đặt phòng!');
    } catch (error) {
      console.error('Có lỗi xảy ra. Vui lòng thử lại.', error);
    }
  };

  const handleWaitlistReservation = async (reservationId) => {
    try {
      await houseService.updateReservationStatus(reservationId, RESERVATION_STATUS.WAITLIST);
      await loadReservations(selectedHouse.id);
      console.log('Đã chuyển vào danh sách chờ!');
    } catch (error) {
      console.error('Có lỗi xảy ra. Vui lòng thử lại.', error);
    }
  };

  const handleViewStudentProfile = (student) => {
    // Navigate to public profile page
    navigate(`/profile/${student.firebaseUid || student.id}`);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 140px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #E5E7EB',
            borderTopColor: '#4F46E5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6B7280' }}>Đang tải...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Render house detail view
  if (viewMode === 'detail' && selectedHouse) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 140px)',
        backgroundColor: '#F9FAFB',
        padding: '24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button
              onClick={handleBack}
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                color: '#374151'
              }}
            >
              ← Quay lại
            </button>
            <button
              onClick={() => handleEditHouse(selectedHouse)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Edit size={16} />
              Chỉnh sửa
            </button>
          </div>

          {/* House Images */}
          {selectedHouse.images && selectedHouse.images.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '24px'
            }}>
              <img
                src={selectedHouse.images[0]}
                alt={selectedHouse.title}
                style={{
                  width: '100%',
                  height: '400px',
                  objectFit: 'cover'
                }}
              />
              {selectedHouse.images.length > 1 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '8px',
                  padding: '16px'
                }}>
                  {selectedHouse.images.slice(1).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${selectedHouse.title} ${idx + 2}`}
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* House Info */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px'
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              marginBottom: '12px',
              color: '#111827'
            }}>
              {selectedHouse.title}
            </h2>

            {/* Room Type Badge */}
            <div style={{ marginBottom: '16px' }}>
              <span style={{
                display: 'inline-block',
                padding: '6px 14px',
                backgroundColor: selectedHouse.roomType === 'single' ? '#DBEAFE' : 
                                 selectedHouse.roomType === 'double' ? '#E0E7FF' : '#FEF3C7',
                color: selectedHouse.roomType === 'single' ? '#1E40AF' : 
                       selectedHouse.roomType === 'double' ? '#4338CA' : '#92400E',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                {selectedHouse.roomType === 'single' ? '🛏️ Phòng đơn' :
                 selectedHouse.roomType === 'double' ? '🛏️🛏️ Phòng đôi' : '🏠 Phòng tập thể'}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              color: '#6B7280'
            }}>
              <MapPin size={20} />
              {selectedHouse.address}
            </div>

            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#4F46E5',
              marginBottom: '24px'
            }}>
              {selectedHouse.price?.toLocaleString()}₫/tháng
            </div>

            {selectedHouse.description && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  Mô tả
                </h3>
                <p style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#374151'
                }}>
                  {selectedHouse.description}
                </p>
              </div>
            )}

            {/* Costs Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '12px'
              }}>
                Chi phí
              </h3>
              
              {/* Electricity and Water - Always show if available */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {selectedHouse.costs?.find(c => c.name === 'Điện') && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#F0F9FF',
                    borderRadius: '8px',
                    border: '1px solid #BAE6FD'
                  }}>
                    <div style={{ fontSize: '13px', color: '#0369A1', marginBottom: '4px' }}>
                      Tiền điện
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#0C4A6E' }}>
                      {selectedHouse.costs.find(c => c.name === 'Điện').price?.toLocaleString()}₫/kWh
                    </div>
                  </div>
                )}
                {selectedHouse.costs?.find(c => c.name === 'Nước') && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#F0F9FF',
                    borderRadius: '8px',
                    border: '1px solid #BAE6FD'
                  }}>
                    <div style={{ fontSize: '13px', color: '#0369A1', marginBottom: '4px' }}>
                      Tiền nước
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#0C4A6E' }}>
                      {selectedHouse.costs.find(c => c.name === 'Nước').price?.toLocaleString()}₫/m³
                    </div>
                  </div>
                )}
              </div>

              {/* Other costs */}
              {selectedHouse.costs?.filter(c => c.name !== 'Điện' && c.name !== 'Nước').length > 0 && (
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '8px', color: '#6B7280' }}>
                    Chi phí khác
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedHouse.costs.filter(c => c.name !== 'Điện' && c.name !== 'Nước').map((cost, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '12px',
                          backgroundColor: '#F9FAFB',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      >
                        <span>{cost.name}</span>
                        <span style={{ fontWeight: '600' }}>
                          {cost.price?.toLocaleString()}{cost.unit || '₫'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Amenities Section */}
            {selectedHouse.amenities && selectedHouse.amenities.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  Tiện ích
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px'
                }}>
                  {selectedHouse.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '12px',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    >
                      ✓ {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render edit view
  if (viewMode === 'edit' && selectedHouse && editFormData) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 140px)',
        backgroundColor: '#F9FAFB',
        padding: '24px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button
              onClick={handleCancelEdit}
              disabled={isSaving}
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <XCircle size={16} />
              Hủy
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isSaving}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Save size={16} />
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '12px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: '#111827'
            }}>
              Chỉnh sửa thông tin nhà
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              marginBottom: '32px'
            }}>
              Cập nhật thông tin để thu hút sinh viên hơn
            </p>

            {/* Step 1: Images */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#111827'
              }}>
                Hình ảnh nhà trọ
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '16px'
              }}>
                Tải lên ít nhất 1 ảnh để thu hút sinh viên hơn
              </p>
              <ImageUpload
                images={editFormData.images}
                onChange={(images) => setEditFormData({ ...editFormData, images })}
                maxImages={10}
              />
            </div>

            <div style={{
              height: '1px',
              backgroundColor: '#E5E7EB',
              margin: '32px 0'
            }} />

            {/* Step 2: Basic Info - Thứ tự: Tên -> Loại -> Địa chỉ -> Giá */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#111827'
              }}>
                Thông tin cơ bản
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '16px'
              }}>
                Thông tin chính về nhà trọ
              </p>

              {/* Title */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Tên nhà *
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="VD: Phòng trọ sinh viên gần ĐHQG"
                />
              </div>

              {/* Room Type */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Loại phòng *
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
                      onClick={() => setEditFormData({ ...editFormData, roomType: type.value })}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: editFormData.roomType === type.value ? '#4F46E5' : 'white',
                        color: editFormData.roomType === type.value ? 'white' : '#374151',
                        border: `2px solid ${editFormData.roomType === type.value ? '#4F46E5' : '#E5E7EB'}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Địa chỉ *
                </label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="VD: 144 Xuân Thủy, Cầu Giấy, Hà Nội"
                />
              </div>

              {/* Price */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Giá thuê (VNĐ/tháng) *
                </label>
                <input
                  type="number"
                  value={editFormData.price}
                  onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="VD: 2000000"
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Mô tả
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
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
                  placeholder="Mô tả chi tiết về nhà trọ..."
                />
              </div>
            </div>

            <div style={{
              height: '1px',
              backgroundColor: '#E5E7EB',
              margin: '32px 0'
            }} />

            {/* Step 3: Chi phí */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#111827'
              }}>
                Chi phí
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '16px'
              }}>
                Chi phí điện, nước và các chi phí khác
              </p>

              {/* Electricity Price */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Giá điện (₫/kWh) *
                </label>
                <input
                  type="number"
                  value={editFormData.electricityPrice}
                  onChange={(e) => setEditFormData({ ...editFormData, electricityPrice: e.target.value })}
                  placeholder="5000"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Water Price */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Giá nước (₫/m³) *
                </label>
                <input
                  type="number"
                  value={editFormData.waterPrice}
                  onChange={(e) => setEditFormData({ ...editFormData, waterPrice: e.target.value })}
                  placeholder="20000"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Additional Costs */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Chi phí khác
                </label>
                
                {editFormData.costs && editFormData.costs.map((cost, index) => (
                  <div
                    key={index}
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
                        onClick={() => {
                          const newCosts = editFormData.costs.filter((_, i) => i !== index);
                          setEditFormData({ ...editFormData, costs: newCosts });
                        }}
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

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <input
                    type="text"
                    id="newCostName"
                    placeholder="Tên chi phí (VD: Rác)"
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
                    id="newCostPrice"
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
                    id="newCostUnit"
                    defaultValue="₫"
                    placeholder="Đơn vị"
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
                    onClick={() => {
                      const name = document.getElementById('newCostName').value;
                      const price = document.getElementById('newCostPrice').value;
                      const unit = document.getElementById('newCostUnit').value;
                      if (name && price) {
                        const newCosts = [...(editFormData.costs || []), { name, price: Number(price), unit: unit || '₫' }];
                        setEditFormData({ ...editFormData, costs: newCosts });
                        document.getElementById('newCostName').value = '';
                        document.getElementById('newCostPrice').value = '';
                        document.getElementById('newCostUnit').value = '₫';
                      }
                    }}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#4F46E5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Thêm
                  </button>
                </div>
              </div>
            </div>

            <div style={{
              height: '1px',
              backgroundColor: '#E5E7EB',
              margin: '32px 0'
            }} />

            {/* Step 4: Amenities */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}>
                Tiện ích
              </label>
              
              {/* Suggested Amenities */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                  Tiện ích gợi ý:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Bếp', 'Máy giặt', 'Điều hòa', 'Nóng lạnh', 'WiFi', 'Tủ lạnh', 'Ban công', 'Chỗ để xe', 'Bảo vệ 24/7', 'Camera an ninh'].map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => {
                        if (editFormData.amenities.includes(amenity)) {
                          setEditFormData({
                            ...editFormData,
                            amenities: editFormData.amenities.filter(a => a !== amenity)
                          });
                        } else {
                          setEditFormData({
                            ...editFormData,
                            amenities: [...editFormData.amenities, amenity]
                          });
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: editFormData.amenities.includes(amenity) ? '#4F46E5' : 'white',
                        color: editFormData.amenities.includes(amenity) ? 'white' : '#374151',
                        border: editFormData.amenities.includes(amenity) ? 'none' : '1px solid #E5E7EB',
                        borderRadius: '20px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {editFormData.amenities.includes(amenity) ? '✓ ' : ''}{amenity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Amenities */}
              {editFormData.amenities.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                    Đã chọn:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {editFormData.amenities.map((amenity, index) => (
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
                          onClick={() => {
                            const newAmenities = editFormData.amenities.filter((_, i) => i !== index);
                            setEditFormData({ ...editFormData, amenities: newAmenities });
                          }}
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

              {/* Custom Amenity Input */}
              <input
                type="text"
                placeholder="Thêm tiện ích khác (nhấn Enter)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    if (!editFormData.amenities.includes(e.target.value.trim())) {
                      setEditFormData({
                        ...editFormData,
                        amenities: [...editFormData.amenities, e.target.value.trim()]
                      });
                    }
                    e.target.value = '';
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
        </div>
      </div>
      </div>
    );
  }

  // Render reservations view
  if (viewMode === 'reservations' && selectedHouse) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 140px)',
        backgroundColor: '#F9FAFB',
        padding: '24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <button
            onClick={handleBack}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '24px',
              color: '#374151'
            }}
          >
            ← Quay lại
          </button>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: '#111827'
            }}>
              {selectedHouse.title}
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#6B7280',
              fontSize: '14px'
            }}>
              <MapPin size={16} />
              {selectedHouse.address}
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#111827'
            }}>
              Danh sách đặt phòng ({reservations.length})
            </h3>

            {reservations.length === 0 ? (
              <div style={{
                padding: '48px',
                textAlign: 'center',
                color: '#6B7280'
              }}>
                <Users size={48} style={{ margin: '0 auto 16px' }} />
                <p>Chưa có đặt phòng nào</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reservations.map(reservation => {
                  const student = studentsMap[reservation.studentId];
                  
                  return (
                    <div
                      key={reservation.id}
                      style={{
                        padding: '16px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        {/* Avatar - clickable to view profile */}
                        {student?.avatar ? (
                          <img
                            src={student.avatar}
                            alt={student.name}
                            onClick={() => handleViewStudentProfile(student)}
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              cursor: 'pointer',
                              border: '2px solid transparent',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.border = '2px solid #4F46E5';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.border = '2px solid transparent';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          />
                        ) : (
                          <div 
                            onClick={() => handleViewStudentProfile(student)}
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              backgroundColor: '#E5E7EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              border: '2px solid transparent',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#D1D5DB';
                              e.currentTarget.style.border = '2px solid #4F46E5';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#E5E7EB';
                              e.currentTarget.style.border = '2px solid transparent';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <Users size={24} color="#6B7280" />
                          </div>
                        )}

                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            marginBottom: '4px',
                            color: '#111827'
                          }}>
                            {student?.name || 'Sinh viên'}
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '11px',
                              color: '#6B7280',
                              fontWeight: '400',
                              fontStyle: 'italic'
                            }}>
                              (Click avatar để xem profile)
                            </span>
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: '#6B7280',
                            marginBottom: '4px'
                          }}>
                            Email: {student?.email}
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: '#6B7280'
                          }}>
                            SĐT: {student?.phone}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#9CA3AF',
                            marginTop: '4px'
                          }}>
                            Đặt ngày: {formatDate(reservation.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Show action buttons for all statuses except EXPIRED */}
                        {reservation.status !== RESERVATION_STATUS.EXPIRED && (
                          <React.Fragment>
                            <button
                              onClick={() => handleApproveReservation(reservation.id)}
                              disabled={reservation.status === RESERVATION_STATUS.APPROVED}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: reservation.status === RESERVATION_STATUS.APPROVED ? '#10B981' : 'white',
                                color: reservation.status === RESERVATION_STATUS.APPROVED ? 'white' : '#10B981',
                                border: `1px solid #10B981`,
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: reservation.status === RESERVATION_STATUS.APPROVED ? 'not-allowed' : 'pointer',
                                opacity: reservation.status === RESERVATION_STATUS.APPROVED ? 1 : 0.9,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Check size={16} />
                              {reservation.status === RESERVATION_STATUS.APPROVED ? 'Đã duyệt' : 'Duyệt'}
                            </button>
                            <button
                              onClick={() => handleWaitlistReservation(reservation.id)}
                              disabled={reservation.status === RESERVATION_STATUS.WAITLIST}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: reservation.status === RESERVATION_STATUS.WAITLIST ? '#F59E0B' : 'white',
                                color: reservation.status === RESERVATION_STATUS.WAITLIST ? 'white' : '#F59E0B',
                                border: `1px solid #F59E0B`,
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: reservation.status === RESERVATION_STATUS.WAITLIST ? 'not-allowed' : 'pointer',
                                opacity: reservation.status === RESERVATION_STATUS.WAITLIST ? 1 : 0.9,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Clock size={16} />
                              {reservation.status === RESERVATION_STATUS.WAITLIST ? 'Đang chờ' : 'Chờ'}
                            </button>
                            <button
                              onClick={() => handleRejectReservation(reservation.id)}
                              disabled={reservation.status === RESERVATION_STATUS.REJECTED}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: reservation.status === RESERVATION_STATUS.REJECTED ? '#EF4444' : 'white',
                                color: reservation.status === RESERVATION_STATUS.REJECTED ? 'white' : '#EF4444',
                                border: `1px solid #EF4444`,
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: reservation.status === RESERVATION_STATUS.REJECTED ? 'not-allowed' : 'pointer',
                                opacity: reservation.status === RESERVATION_STATUS.REJECTED ? 1 : 0.9,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <X size={16} />
                              {reservation.status === RESERVATION_STATUS.REJECTED ? 'Đã từ chối' : 'Từ chối'}
                            </button>
                          </React.Fragment>
                        )}

                        {/* Only show badge for EXPIRED status */}
                        {reservation.status === RESERVATION_STATUS.EXPIRED && (
                          <span style={{
                            padding: '6px 12px',
                            backgroundColor: '#F3F4F6',
                            color: '#6B7280',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            Hết hạn
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 140px)',
      backgroundColor: '#F9FAFB',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '24px',
          color: '#111827'
        }}>
          Nhà đã đăng ({houses.length})
        </h2>

        {houses.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '64px 24px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <Home size={64} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#6B7280',
              marginBottom: '8px'
            }}>
              Chưa có nhà nào
            </h3>
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
              Hãy đăng nhà đầu tiên của bạn!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {houses.map(house => (
              <div
                key={house.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {house.images && house.images[0] ? (
                  <img
                    src={house.images[0]}
                    alt={house.title}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Home size={48} color="#D1D5DB" />
                  </div>
                )}

                <div style={{ padding: '16px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: '#111827'
                  }}>
                    {house.title || 'Nhà trọ'}
                  </h3>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#6B7280'
                  }}>
                    <MapPin size={16} />
                    {house.address}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '12px',
                    borderTop: '1px solid #E5E7EB',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#4F46E5'
                      }}>
                        {house.price?.toLocaleString()}₫
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        / tháng
                      </div>
                    </div>

                    {house.averageRating > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Star size={16} fill="#F59E0B" color="#F59E0B" />
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {house.averageRating.toFixed(1)}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: '#6B7280'
                        }}>
                          ({house.totalReviews})
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <button
                      onClick={() => handleViewDetail(house)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#4F46E5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Eye size={16} />
                      Xem chi tiết
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleViewReservations(house)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: 'white',
                          color: '#4F46E5',
                          border: '1px solid #4F46E5',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Users size={16} />
                        DS đặt phòng
                      </button>
                      <button
                        onClick={() => handleDeleteHouse(house.id)}
                        style={{
                          padding: '10px',
                          backgroundColor: 'white',
                          color: '#EF4444',
                          border: '1px solid #EF4444',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyListings;