import React, { useState, useEffect, useCallback } from 'react';
import { Home, MapPin, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import houseService from '../../services/houseService';
import { RESERVATION_STATUS } from '../../utils/constants';

const MyHouses = ({ currentUser, onOpenHouse }) => {
  const [reservations, setReservations] = useState([]);
  const [housesMap, setHousesMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      const userReservations = await houseService.getStudentReservations(currentUser.id);
      console.log('📋 Total reservations:', userReservations.length);

      // Load house details for each reservation
      const houses = {};
      const validReservations = [];
      
      for (const reservation of userReservations) {
        const house = await houseService.getHouse(reservation.houseId);
        if (house) {
          houses[house.id] = house;
          validReservations.push(reservation);
        } else {
          console.warn(`⚠️ Skipping reservation ${reservation.id}: house ${reservation.houseId} not found`);
        }
      }
      
      console.log('✅ Valid reservations:', validReservations.length);
      console.log('🏠 Unique houses:', new Set(validReservations.map(r => r.houseId)).size);
      
      setReservations(validReservations);
      setHousesMap(houses);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const getFilteredReservations = () => {
    let filtered = activeFilter === 'all' ? reservations : reservations.filter(r => r.status === activeFilter);
    
    // Group by houseId and keep only the latest reservation for each house
    const houseReservationMap = new Map();
    filtered.forEach(reservation => {
      const existing = houseReservationMap.get(reservation.houseId);
      if (!existing || reservation.createdAt > existing.createdAt) {
        houseReservationMap.set(reservation.houseId, reservation);
      }
    });
    
    return Array.from(houseReservationMap.values());
  };

  const getStatusConfig = (status) => {
    const configs = {
      [RESERVATION_STATUS.PENDING]: {
        color: '#F59E0B',
        icon: Clock,
        text: 'Đang chờ duyệt',
        bgColor: '#FEF3C7'
      },
      [RESERVATION_STATUS.APPROVED]: {
        color: '#10B981',
        icon: CheckCircle,
        text: 'Đã được duyệt',
        bgColor: '#D1FAE5'
      },
      [RESERVATION_STATUS.REJECTED]: {
        color: '#EF4444',
        icon: XCircle,
        text: 'Đã bị từ chối',
        bgColor: '#FEE2E2'
      },
      [RESERVATION_STATUS.EXPIRED]: {
        color: '#6B7280',
        icon: XCircle,
        text: 'Đã hết hạn',
        bgColor: '#F3F4F6'
      }
    };
    return configs[status] || configs[RESERVATION_STATUS.PENDING];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredReservations = getFilteredReservations();

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
          Nhà của tôi
        </h2>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          backgroundColor: 'white',
          padding: '8px',
          borderRadius: '12px',
          border: '1px solid #E5E7EB'
        }}>
          {[
            { id: 'all', label: 'Tất cả', count: new Set(reservations.map(r => r.houseId)).size },
            { id: RESERVATION_STATUS.PENDING, label: 'Đang chờ', count: new Set(reservations.filter(r => r.status === RESERVATION_STATUS.PENDING).map(r => r.houseId)).size },
            { id: RESERVATION_STATUS.APPROVED, label: 'Đã duyệt', count: new Set(reservations.filter(r => r.status === RESERVATION_STATUS.APPROVED).map(r => r.houseId)).size },
            { id: RESERVATION_STATUS.REJECTED, label: 'Bị từ chối', count: new Set(reservations.filter(r => r.status === RESERVATION_STATUS.REJECTED).map(r => r.houseId)).size }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: activeFilter === filter.id ? '#4F46E5' : 'transparent',
                color: activeFilter === filter.id ? 'white' : '#6B7280',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              {filter.label}
              {filter.count > 0 && (
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  backgroundColor: activeFilter === filter.id ? 'rgba(255,255,255,0.2)' : '#E5E7EB',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Reservations List */}
        {filteredReservations.length === 0 ? (
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
              Chưa có đặt phòng nào
            </h3>
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
              Hãy tìm và đặt phòng ngay để bắt đầu!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {filteredReservations.map(reservation => {
              const house = housesMap[reservation.houseId];
              if (!house) return null;

              const statusConfig = getStatusConfig(reservation.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={reservation.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #E5E7EB',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  onClick={() => onOpenHouse && onOpenHouse(house)}
                >
                  {/* House Image */}
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

                  {/* Content */}
                  <div style={{ padding: '16px' }}>
                    {/* Status Badge */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      backgroundColor: statusConfig.bgColor,
                      color: statusConfig.color,
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginBottom: '12px'
                    }}>
                      <StatusIcon size={14} />
                      {statusConfig.text}
                    </div>

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
                      borderTop: '1px solid #E5E7EB'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6B7280',
                          marginBottom: '4px'
                        }}>
                          Giá thuê
                        </div>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#4F46E5'
                        }}>
                          {house.price?.toLocaleString()}₫
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '12px',
                          color: '#6B7280',
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Calendar size={14} />
                          Đặt ngày
                        </div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151'
                        }}>
                          {formatDate(reservation.createdAt)}
                        </div>
                      </div>
                    </div>

                    {reservation.status === RESERVATION_STATUS.PENDING && (
                      <div style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        backgroundColor: '#FEF3C7',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#92400E'
                      }}>
                        Hết hạn: {formatDate(reservation.expiresAt)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyHouses;