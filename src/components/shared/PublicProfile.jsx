import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Phone, Mail, MapPin, Home, MessageSquare } from 'lucide-react';
import authService from '../../services/authService';
import houseService from '../../services/houseService';

const PublicProfile = ({ currentUser }) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const u = await authService.getUser(userId);
        setUser(u);
        if (u?.role === 'landlord') {
          const hs = await houseService.getHousesByLandlord(userId);
          setHouses(hs);
        }
      } catch (e) {
        console.error('Load public profile error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Đang tải hồ sơ...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: 24 }}>Không tìm thấy người dùng.</div>
    );
  }

  const handleGoBack = () => {
    // Try to go back in history, or fallback to home
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 24px' }}>
        <button onClick={handleGoBack} style={{ border: 'none', background: 'transparent', color: '#4F46E5', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>← Quay lại</button>
      </header>
      <main style={{ maxWidth: 1000, margin: '24px auto', padding: '0 16px' }}>
        <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', gap: 24, padding: 24, borderBottom: '1px solid #E5E7EB' }}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={60} color="#6B7280" />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{user.name || 'Người dùng'}</h1>
              <div style={{ display: 'inline-block', padding: '4px 12px', background: user.role === 'landlord' ? '#D1FAE5' : '#EEF2FF', color: user.role === 'landlord' ? '#065F46' : '#3730A3', borderRadius: 16, fontSize: 12, fontWeight: 700 }}>
                {user.role === 'landlord' ? 'Chủ nhà' : 'Sinh viên'}
              </div>
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {user.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', fontSize: 14 }}>
                    <Phone size={16} /> {user.phone}
                  </div>
                )}
                {user.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', fontSize: 14 }}>
                    <Mail size={16} /> {user.email}
                  </div>
                )}
                {user.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', fontSize: 14 }}>
                    <MapPin size={16} /> {user.address}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <button
                onClick={() => {
                  // Navigate back to dashboard with chat tab and target user
                  if (currentUser?.role === 'landlord') {
                    navigate('/', { state: { activeTab: 'chat', targetUserId: userId } });
                  } else if (currentUser?.role === 'student') {
                    navigate('/', { state: { activeTab: 'chat', targetUserId: userId } });
                  } else {
                    navigate('/');
                  }
                }}
                style={{ padding: '10px 16px', backgroundColor: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <MessageSquare size={18} /> Chat
              </button>
            </div>
          </div>

          {user.role === 'landlord' && (
            <div style={{ padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#111827' }}>Danh sách nhà</h2>
              {houses.length === 0 ? (
                <div style={{ color: '#6B7280' }}>Chưa có nhà nào.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {houses.map(h => (
                    <div key={h.id} style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', background: 'white' }}>
                      {h.images && h.images[0] ? (
                        <img src={h.images[0]} alt={h.title} style={{ width: '100%', height: 150, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: 150, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Home size={32} color="#D1D5DB" />
                        </div>
                      )}
                      <div style={{ padding: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 6 }}>{h.title || 'Nhà trọ'}</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{h.address}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PublicProfile;
