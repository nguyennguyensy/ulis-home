import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Home, Plus, List, MessageSquare, User } from 'lucide-react';
import LandlordProfile from './LandlordProfile';
import AddHouse from './AddHouse';
import MyListings from './MyListings';
import LandlordChat from './LandlordChat';
import authService from '../../services/authService';
import chatService from '../../services/chatService';

const LandlordDashboard = ({ currentUser: appCurrentUser, onLogout }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'listings');
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatDraftTarget, setChatDraftTarget] = useState(location.state?.targetUserId || null);

  const loadData = useCallback(async () => {
    const user = appCurrentUser || await authService.getCurrentUser();
    setCurrentUser(user);

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

  const handleHouseAdded = () => {
    setActiveTab('listings');
    loadData();
  };

  const renderTabContent = () => {
    // If currentUser not yet loaded, show a loading placeholder to avoid passing null to children
    if (!currentUser || !currentUser.id) {
      return (
        <div style={{ minHeight: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', border: '4px solid #E5E7EB', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#6B7280' }}>Đang tải...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'listings':
        return <MyListings currentUser={currentUser} />;
      case 'add':
        return <AddHouse currentUser={currentUser} onSuccess={handleHouseAdded} />;
      case 'chat':
        return (
          <LandlordChat 
            currentUser={currentUser} 
            draftTargetId={chatDraftTarget}
            onMessagesRead={async () => {
              console.log('🔄 Landlord: Reloading unread count...');
              const count = await chatService.getUnreadCount(currentUser.id);
              console.log('✅ Landlord: New unread count:', count);
              setUnreadCount(count);
            }}
          />
        );
      case 'profile':
        return <LandlordProfile currentUser={currentUser} />;
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
          <span style={{
            padding: '4px 12px',
            backgroundColor: '#EEF2FF',
            color: '#4F46E5',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            Chủ nhà
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: '#6B7280' }}>
            Xin chào, {currentUser?.name || 'Chủ nhà'}
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
          { id: 'listings', icon: List, label: 'Nhà đã đăng' },
          { id: 'add', icon: Plus, label: 'Đăng nhà mới' },
          { id: 'chat', icon: MessageSquare, label: 'Chat', badge: unreadCount },
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

export default LandlordDashboard;