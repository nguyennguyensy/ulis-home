import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Star, Phone, User, Calendar, CheckCircle, XCircle, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../shared/ToastProvider';
import ReviewSection from '../shared/ReviewSection';
import houseService from '../../services/houseService';
import authService from '../../services/authService';
// import chatService from '../../services/chatService';
import { RESERVATION_STATUS } from '../../utils/constants';

const HouseDetail = ({ house: initialHouse, currentUser, onBack, onReserveSuccess, onOpenChat }) => {
  const [house, setHouse] = useState(initialHouse);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [landlordInfo, setLandlordInfo] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [isReserving, setIsReserving] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [similarRoommates, setSimilarRoommates] = useState([]);
  const toast = useToast();

  useEffect(() => {
    loadData();
    // TEMPORARILY DISABLED: subscribe to reservation for persistence across navigation
    // TO SAVE FIREBASE QUOTA - Re-enable after upgrading to Blaze plan
    // const unsubscribe = houseService.subscribeStudentReservationForHouse(currentUser.id, house.id, (res) => {
    //   setReservation(res);
    // });
    // return () => {
    //   if (unsubscribe) unsubscribe();
    // };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [house.id, currentUser.id]);

  const loadData = async () => {
    // Reload house to get updated reviews
    const updatedHouse = await houseService.getHouse(house.id);
    if (updatedHouse) {
      setHouse(updatedHouse);
    }

    // Load landlord info
    const landlord = await authService.getUser(house.landlordId);
    setLandlordInfo(landlord);

    // Check if user has reservation
    const userReservation = await houseService.getStudentReservationForHouse(currentUser.id, house.id);
    setReservation(userReservation);

    // Check if user can review (has approved reservation)
    const approvedHouses = await houseService.getApprovedHouses(currentUser.id);
    setCanReview(approvedHouses.some(h => h.id === house.id));

    // Load similar roommates only for rooms with maxOccupants >= 2
    console.log('🏠 HouseDetail: maxOccupants =', house.maxOccupants, 'roomType =', house.roomType);
    if (house.maxOccupants >= 2) {
      console.log('🔍 Loading similar roommates for house:', house.id);
      const roommates = await authService.getSimilarRoommates(house.id, currentUser.id);
      console.log('✅ Similar roommates loaded:', roommates.length, roommates);
      setSimilarRoommates(roommates);
    } else {
      console.log('⏭️ Skipping similar roommates (single room)');
      setSimilarRoommates([]);
    }
  };

  const handleReserve = async () => {
    setIsReserving(true);
    // optimistic UI: show pending immediately
    const tempReservation = {
      id: `temp_${Date.now()}`,
      studentId: currentUser.id,
      houseId: house.id,
      status: RESERVATION_STATUS.PENDING,
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
    };
    setReservation(tempReservation);

    try {
      await houseService.createReservation(currentUser.id, house.id);
      // subscription will update reservation; still ensure data refresh
      await loadData();
      onReserveSuccess();
      toast.show('Đã đặt phòng thành công', 'success');
    } catch (error) {
      // rollback
      await loadData();
      console.error(error.message || 'Có lỗi khi đặt phòng.');
      toast.show('Đặt phòng thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setIsReserving(false);
    }
  };

  const handleUnreserve = async () => {
  // non-blocking confirmation: use a simple JS confirm replacement (fallback to confirm if not available)
  // Proceed immediately (removed blocking native confirm to avoid browser modal)

    setIsReserving(true);
    try {
      await houseService.deleteReservation(reservation.id);
      await loadData();
      onReserveSuccess();
      toast.show('Đã hủy đặt phòng', 'success');
    } catch (error) {
      console.error('Có lỗi xảy ra. Vui lòng thử lại.');
      toast.show('Hủy đặt phòng thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setIsReserving(false);
    }
  };

  const handleChat = async () => {
    // Open chat as a draft in the parent (do not create DB conversation yet)
    try {
      if (onOpenChat) {
        onOpenChat(house.landlordId);
      }
    } catch (error) {
      console.error('Open chat error', error);
  console.error('Có lỗi xảy ra khi mở chat.');
    }
  };

  const handleSubmitReview = async (rating, comment) => {
    try {
      await houseService.addReview(house.id, currentUser.id, rating, comment);
      await loadData(); // Reload house to get new reviews
      toast.show('Đánh giá của bạn đã được gửi!', 'success');
    } catch (error) {
      console.error('Submit review error:', error);
      toast.show('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % house.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + house.images.length) % house.images.length);
  };

  const getExpiryDate = () => {
    if (!reservation) return null;
    return new Date(reservation.expiresAt).toLocaleDateString('vi-VN');
  };

  const renderReservationStatus = () => {
    if (!reservation) {
      return (
        <button
          onClick={handleReserve}
          disabled={isReserving}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: isReserving ? '#9CA3AF' : '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isReserving ? 'not-allowed' : 'pointer',
            marginTop: '16px'
          }}
        >
          {isReserving ? 'Đang đặt...' : 'Đặt phòng'}
        </button>
      );
    }

    const statusConfig = {
      [RESERVATION_STATUS.PENDING]: {
        color: '#F59E0B',
        icon: Calendar,
        text: 'Đang chờ duyệt',
        description: `Hết hạn: ${getExpiryDate()}`
      },
      [RESERVATION_STATUS.APPROVED]: {
        color: '#10B981',
        icon: CheckCircle,
        text: 'Đã được duyệt',
        description: 'Bạn có thể liên hệ chủ nhà để xem phòng'
      },
      [RESERVATION_STATUS.REJECTED]: {
        color: '#EF4444',
        icon: XCircle,
        text: 'Đã bị từ chối',
        description: 'Bạn có thể tìm nhà khác'
      },
      [RESERVATION_STATUS.EXPIRED]: {
        color: '#6B7280',
        icon: XCircle,
        text: 'Đã hết hạn',
        description: 'Yêu cầu của bạn đã hết hạn'
      },
      [RESERVATION_STATUS.WAITLIST]: {
        color: '#3B82F6',
        icon: Calendar,
        text: 'Trong danh sách chờ',
        description: 'Phòng hiện đã đầy. Bạn sẽ được ưu tiên khi có chỗ trống'
      }
    };

    const status = statusConfig[reservation.status];
    const StatusIcon = status.icon;

    return (
      <div style={{
        marginTop: '16px',
        padding: '16px',
        backgroundColor: '#F9FAFB',
        borderRadius: '8px',
        border: `2px solid ${status.color}`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <StatusIcon size={24} color={status.color} />
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: status.color
            }}>
              {status.text}
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              {status.description}
            </div>
          </div>
        </div>

        {(reservation.status === RESERVATION_STATUS.PENDING || reservation.status === RESERVATION_STATUS.WAITLIST) && (
          <button
            onClick={handleUnreserve}
            disabled={isReserving}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'white',
              color: '#EF4444',
              border: '1px solid #EF4444',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isReserving ? 'not-allowed' : 'pointer',
              marginTop: '12px'
            }}
          >
            Hủy đặt phòng
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 140px)',
      backgroundColor: '#F9FAFB',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Back Button */}
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
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
          <ArrowLeft size={18} />
          Quay lại
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Left Column */}
          <div>
            {/* Image Gallery */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '24px'
            }}>
              {house.images && house.images.length > 0 ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={house.images[currentImageIndex]}
                    alt={`House ${currentImageIndex + 1}`}
                    style={{
                      width: '100%',
                      height: '500px',
                      objectFit: 'cover'
                    }}
                  />

                  {house.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        style={{
                          position: 'absolute',
                          left: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <ChevronLeft size={24} />
                      </button>

                      <button
                        onClick={nextImage}
                        style={{
                          position: 'absolute',
                          right: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <ChevronRight size={24} />
                      </button>

                      <div style={{
                        position: 'absolute',
                        bottom: '16px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '8px'
                      }}>
                        {house.images.map((_, index) => (
                          <div
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            style={{
                              width: index === currentImageIndex ? '24px' : '8px',
                              height: '8px',
                              borderRadius: '4px',
                              backgroundColor: index === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div style={{
                  width: '100%',
                  height: '500px',
                  backgroundColor: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9CA3AF'
                }}>
                  Không có ảnh
                </div>
              )}
            </div>

            {/* House Info */}
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                marginBottom: '16px',
                color: '#111827'
              }}>
                {house.title || 'Nhà trọ'}
              </h1>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                color: '#6B7280'
              }}>
                <MapPin size={20} />
                <span>{house.address}</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #E5E7EB',
                flexWrap: 'wrap'
              }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#6B7280' }}>Giá thuê</div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#4F46E5'
                  }}>
                    {house.price?.toLocaleString()}₫/tháng
                  </div>
                </div>

                {house.roomType && (
                  <div>
                    <div style={{ fontSize: '14px', color: '#6B7280' }}>Loại phòng</div>
                    <div style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      backgroundColor: house.roomType === 'single' ? '#DBEAFE' : '#FCE7F3',
                      color: house.roomType === 'single' ? '#1E40AF' : '#BE185D',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginTop: '4px'
                    }}>
                      {house.roomType === 'single' ? '🏠 Phòng đơn' : '👥 Phòng đôi'}
                    </div>
                  </div>
                )}

                {house.averageRating > 0 && (
                  <div style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Star size={24} fill="#F59E0B" color="#F59E0B" />
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      {house.averageRating.toFixed(1)}
                    </span>
                    <span style={{ fontSize: '14px', color: '#6B7280' }}>
                      ({house.totalReviews} đánh giá)
                    </span>
                  </div>
                )}
              </div>

              {house.description && (
                <div style={{ marginTop: '24px' }}>
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
                    {house.description}
                  </p>
                </div>
              )}

              {house.amenities && house.amenities.length > 0 && (
                <div style={{ marginTop: '24px' }}>
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
                    {house.amenities.map((amenity, index) => (
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

              {house.costs && house.costs.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '12px'
                  }}>
                    Chi phí
                  </h3>

                  {/* Electricity and Water */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    {house.costs.find(c => c.name === 'Điện') && (
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
                          {house.costs.find(c => c.name === 'Điện').price?.toLocaleString()}₫/kWh
                        </div>
                      </div>
                    )}
                    
                    {house.costs.find(c => c.name === 'Nước') && (
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
                          {house.costs.find(c => c.name === 'Nước').price?.toLocaleString()}₫/m³
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Other costs */}
                  {house.costs.filter(c => c.name !== 'Điện' && c.name !== 'Nước').length > 0 && (
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '8px', color: '#6B7280' }}>
                        Chi phí khác
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {house.costs.filter(c => c.name !== 'Điện' && c.name !== 'Nước').map((cost, index) => (
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
              )}
            </div>

            {/* Reviews */}
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px'
            }}>
              <ReviewSection
                reviews={house.reviews || []}
                averageRating={house.averageRating || 0}
                totalReviews={house.totalReviews || 0}
                canReview={canReview}
                currentUserId={currentUser?.id}
                onSubmitReview={handleSubmitReview}
              />
            </div>

            {/* Similar Roommates */}
            {similarRoommates && similarRoommates.length > 0 && (
              <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '16px'
                }}>
                  Sinh viên phù hợp
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  marginBottom: '20px'
                }}>
                  Các sinh viên có sở thích tương đồng về độ sạch sẽ, độ ồn và giờ sinh hoạt
                </p>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {similarRoommates.map(roommate => (
                    <div
                      key={roommate.firebaseUid}
                      style={{
                        padding: '16px',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        border: '1px solid #E5E7EB'
                      }}
                    >
                      {roommate.avatar ? (
                        <img
                          src={roommate.avatar}
                          alt={roommate.name}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: '#E5E7EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <User size={24} color="#6B7280" />
                        </div>
                      )}

                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#111827',
                          marginBottom: '4px'
                        }}>
                          {roommate.name}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: '#6B7280'
                        }}>
                          {roommate.age} tuổi
                        </div>
                        {roommate.roommatePreference && (
                          <div style={{
                            fontSize: '12px',
                            color: '#6B7280',
                            marginTop: '6px',
                            lineHeight: '1.4'
                          }}>
                            {roommate.roommatePreference.length > 100
                              ? roommate.roommatePreference.substring(0, 100) + '...'
                              : roommate.roommatePreference}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => window.open(`/profile/${roommate.firebaseUid}`, '_blank')}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: 'white',
                            color: '#4F46E5',
                            border: '1px solid #4F46E5',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <User size={14} />
                          Xem
                        </button>
                        <button
                          onClick={() => onOpenChat(roommate.firebaseUid)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#4F46E5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <MessageSquare size={14} />
                          Chat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Landlord Info & Actions */}
          <div>
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              position: 'sticky',
              top: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px'
              }}>
                Thông tin chủ nhà
              </h3>

              {landlordInfo && (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #E5E7EB'
                  }}>
                    {landlordInfo.avatar ? (
                      <img
                        src={landlordInfo.avatar}
                        alt={landlordInfo.name}
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        backgroundColor: '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <User size={30} color="#6B7280" />
                      </div>
                    )}
                    <div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827'
                      }}>
                        {landlordInfo.name}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#6B7280'
                      }}>
                        Chủ nhà
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    <Phone size={18} />
                    {landlordInfo.phone}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button
                      onClick={() => window.location.assign(`/u/${landlordInfo.id}`)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Xem hồ sơ
                    </button>
                    <button
                      onClick={handleChat}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: 'white',
                        color: '#4F46E5',
                        border: '1px solid #4F46E5',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <MessageSquare size={18} />
                      Nhắn tin với chủ nhà
                    </button>
                  </div>
                </div>
              )}

              {renderReservationStatus()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseDetail;