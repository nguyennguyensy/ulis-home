import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Home, MessageSquare, User, List, MapPin, Search, Filter, Star } from 'lucide-react';
import Map from '../shared/Map';
import HouseDetail from './HouseDetail';
import StudentProfile from './StudentProfile';
import MyHouses from './MyHouses';
import ChatBox from './ChatBox';
import RoommateProfile from './RoommateProfile';
import houseService from '../../services/houseService';
import authService from '../../services/authService';
import chatService from '../../services/chatService';

const StudentDashboard = ({ currentUser: appCurrentUser, onLogout }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'map');
  const [houses, setHouses] = useState([]);
  const [filteredHouses, setFilteredHouses] = useState([]);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    minPrice: '',
    maxPrice: '',
    roomType: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatDraftTarget, setChatDraftTarget] = useState(location.state?.targetUserId || null);

  const loadData = useCallback(async () => {
    const user = appCurrentUser || await authService.getCurrentUser();
    setCurrentUser(user);

    const allHouses = await houseService.getAllHouses();
    setHouses(allHouses);

    // Load unread messages count
    const count = await chatService.getUnreadCount(user.id);
    setUnreadCount(count);
  }, [appCurrentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload unread count when leaving chat tab
  useEffect(() => {
    const reloadUnreadCount = async () => {
      if (currentUser?.id && activeTab !== 'chat') {
        const count = await chatService.getUnreadCount(currentUser.id);
        setUnreadCount(count);
      }
    };
    reloadUnreadCount();
  }, [activeTab, currentUser]);

  const applyFilters = useCallback(() => {
    let filtered = [...houses];

    // Search by address
    if (searchQuery) {
      filtered = filtered.filter(house =>
        house.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by price
    if (filterOptions.minPrice) {
      filtered = filtered.filter(house => house.price >= parseFloat(filterOptions.minPrice));
    }
    if (filterOptions.maxPrice) {
      filtered = filtered.filter(house => house.price <= parseFloat(filterOptions.maxPrice));
    }

    // Filter by room type
    if (filterOptions.roomType) {
      filtered = filtered.filter(house => house.roomType === filterOptions.roomType);
    }

    setFilteredHouses(filtered);
  }, [houses, searchQuery, filterOptions]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleHouseClick = (house) => {
    setSelectedHouse(house);
    setActiveTab('detail');
  };

  const handleReserveSuccess = () => {
    loadData();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'map':
        return (
          <div style={{ height: 'calc(100vh - 140px)' }}>
            {/* Search and Filter Bar */}
            <div style={{
              padding: '16px',
              backgroundColor: 'white',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo địa chỉ..."
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: showFilters ? '#4F46E5' : 'white',
                  color: showFilters ? 'white' : '#374151',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Filter size={18} />
                Lọc
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div style={{
                padding: '16px',
                backgroundColor: '#F9FAFB',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <input
                  type="number"
                  placeholder="Giá tối thiểu"
                  value={filterOptions.minPrice}
                  onChange={(e) => setFilterOptions({ ...filterOptions, minPrice: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    width: '150px'
                  }}
                />
                <input
                  type="number"
                  placeholder="Giá tối đa"
                  value={filterOptions.maxPrice}
                  onChange={(e) => setFilterOptions({ ...filterOptions, maxPrice: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    width: '150px'
                  }}
                />
                <select
                  value={filterOptions.roomType}
                  onChange={(e) => setFilterOptions({ ...filterOptions, roomType: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    width: '150px'
                  }}
                >
                  <option value="">Tất cả loại phòng</option>
                  <option value="single">Phòng đơn</option>
                  <option value="double">Phòng đôi</option>
                  <option value="dorm">Phòng tập thể</option>
                </select>
                <button
                  onClick={() => setFilterOptions({ minPrice: '', maxPrice: '', roomType: '' })}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}

            {/* Map and House List */}
            <div style={{ display: 'flex', height: 'calc(100% - 70px)' }}>
              {/* House List */}
              <div style={{
                width: '400px',
                overflowY: 'auto',
                backgroundColor: 'white',
                borderRight: '1px solid #E5E7EB'
              }}>
                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    {filteredHouses.length} nhà trọ
                  </h3>
                  {filteredHouses.map((house) => (
                    <div
                      key={house.id}
                      onClick={() => handleHouseClick(house)}
                      style={{
                        padding: '12px',
                        marginBottom: '12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#4F46E5';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#E5E7EB';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {house.images && house.images[0] && (
                          <img
                            src={house.images[0]}
                            alt={house.title}
                            style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '6px',
                              objectFit: 'cover'
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            marginBottom: '4px',
                            color: '#111827'
                          }}>
                            {house.title || 'Nhà trọ'}
                          </h4>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginBottom: '4px',
                            fontSize: '12px',
                            color: '#6B7280'
                          }}>
                            <MapPin size={14} />
                            {house.address}
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <span style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#4F46E5'
                            }}>
                              {house.price?.toLocaleString()}₫/tháng
                            </span>
                            {house.averageRating > 0 && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <Star size={14} fill="#F59E0B" color="#F59E0B" />
                                <span style={{ fontSize: '12px', fontWeight: '600' }}>
                                  {house.averageRating.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Room Type */}
                          {house.roomType && (
                            <div style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              backgroundColor: house.roomType === 'single' ? '#DBEAFE' : '#FCE7F3',
                              color: house.roomType === 'single' ? '#1E40AF' : '#BE185D',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              marginBottom: '8px'
                            }}>
                              {house.roomType === 'single' ? '🏠 Phòng đơn' : '👥 Phòng đôi'}
                            </div>
                          )}
                          
                          {/* Availability status */}
                          {!house.isAvailable && (
                            <div style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              marginLeft: house.roomType ? '8px' : '0'
                            }}>
                              🔒 Hết chỗ
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map */}
              <div style={{ flex: 1 }}>
                <Map
                  markers={filteredHouses.map(house => ({
                    lat: house.location?.lat || 21.0285,
                    lng: house.location?.lng || 105.8542,
                    popup: `
                      <div>
                        <strong>${house.title || 'Nhà trọ'}</strong><br/>
                        ${house.roomType ? `<div style="color: ${house.roomType === 'single' ? '#1E40AF' : '#BE185D'}; font-size: 12px; margin: 4px 0;">${house.roomType === 'single' ? '🏠 Phòng đơn' : '👥 Phòng đôi'}</div>` : ''}
                        <span>${house.price?.toLocaleString()}₫/tháng</span>
                      </div>
                    `,
                    onClick: () => handleHouseClick(house)
                  }))}
                  interactive={false}
                  height="100%"
                />
              </div>
            </div>
          </div>
        );

      case 'detail':
        return selectedHouse ? (
          <HouseDetail
            house={selectedHouse}
            currentUser={currentUser}
            onBack={() => setActiveTab('map')}
            onReserveSuccess={handleReserveSuccess}
            onOpenChat={(landlordId) => { setChatDraftTarget(landlordId); setActiveTab('chat'); }}
          />
        ) : null;

      case 'myhouses':
        return (
          <MyHouses
            currentUser={currentUser}
            onOpenHouse={(house) => {
              setSelectedHouse(house);
              setActiveTab('detail');
            }}
          />
        );

      case 'chat':
        return (
          <ChatBox 
            currentUser={currentUser} 
            draftTargetId={chatDraftTarget}
            onMessagesRead={async () => {
              // Reload unread count when messages are marked as read
              console.log('🔄 Reloading unread count...');
              const count = await chatService.getUnreadCount(currentUser.id);
              console.log('✅ New unread count:', count);
              setUnreadCount(count);
            }}
          />
        );

      case 'roommate':
        return <RoommateProfile currentUser={currentUser} onUserUpdate={setCurrentUser} />;

      case 'profile':
        return <StudentProfile currentUser={currentUser} onUserUpdate={setCurrentUser} />;

      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#4F46E5',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Home size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
            ULIS HOME
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: '#6B7280' }}>
            Xin chào, {currentUser?.name || 'Sinh viên'}
          </span>
          {currentUser?.avatar && (
            <img
              src={currentUser.avatar}
              alt="Avatar"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                padding: '8px 12px',
                backgroundColor: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Đăng xuất
            </button>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '0 24px',
        display: 'flex',
        gap: '32px'
      }}>
        {[
          { id: 'map', icon: MapPin, label: 'Tìm nhà' },
          { id: 'myhouses', icon: List, label: 'Nhà của tôi' },
          { id: 'chat', icon: MessageSquare, label: 'Chat', badge: unreadCount },
          { id: 'roommate', icon: User, label: 'Roommate' },
          { id: 'profile', icon: User, label: 'Hồ sơ' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '16px 0',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: `3px solid ${activeTab === tab.id ? '#4F46E5' : 'transparent'}`,
              color: activeTab === tab.id ? '#4F46E5' : '#6B7280',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              position: 'relative'
            }}
          >
            <tab.icon size={18} />
            {tab.label}
            {tab.badge > 0 && (
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '-8px',
                backgroundColor: '#EF4444',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '10px',
                minWidth: '18px',
                textAlign: 'center'
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main>
        {renderTabContent()}
      </main>
    </div>
  );
};

export default StudentDashboard;