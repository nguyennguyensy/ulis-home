import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import PersonalInfo from './PersonalInfo';
import EmailVerification from './EmailVerification';
import { Home } from 'lucide-react';

const AuthContainer = ({ onAuthSuccess, currentUser }) => {
  console.log('AuthContainer rendered, currentUser:', currentUser);
  const [view, setView] = useState('login'); // 'login', 'register', 'personalInfo', 'emailVerification'
  const [tempUser, setTempUser] = useState(null);

  // Auto-show appropriate screen based on user state from auth listener
  React.useEffect(() => {
    if (currentUser) {
      setTempUser(currentUser);
      
      if (currentUser.requiresEmailVerification) {
        setView('emailVerification');
      } else if (!currentUser.isProfileComplete) {
        setView('personalInfo');
      } else {
        // User is fully authenticated and has complete profile
        onAuthSuccess(currentUser);
      }
    }
  }, [currentUser, onAuthSuccess]);

  const handleLoginSuccess = (user) => {
    console.log('handleLoginSuccess - user:', user);
    // Check email verification first
    if (user.requiresEmailVerification) {
      setTempUser(user);
      setView('emailVerification');
    } else if (!user.isProfileComplete) {
      setTempUser(user);
      setView('personalInfo');
    } else {
      onAuthSuccess(user);
    }
  };

  const handleRegisterSuccess = (user) => {
    setTempUser(user);
    // Check if email verification is required
    if (user.requiresEmailVerification) {
      setView('emailVerification');
    } else {
      setView('personalInfo');
    }
  };

  const handleProfileComplete = (user) => {
    onAuthSuccess(user);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#F9FAFB'
    }}>
      {/* Left Side - Branding */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        padding: '48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '32px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'white',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Home size={28} color="#4F46E5" />
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
              ULIS HOME
            </h1>
          </div>

          <h2 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px', lineHeight: 1.2 }}>
            Tìm nhà trọ<br />dễ dàng hơn
          </h2>

          <p style={{ fontSize: '18px', opacity: 0.9, lineHeight: 1.6, maxWidth: '500px' }}>
            Nền tảng kết nối sinh viên với các chủ nhà uy tín. 
            Tìm kiếm, đặt phòng và đánh giá nhà trọ một cách nhanh chóng và thuận tiện.
          </p>

          <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>✓</div>
              <span style={{ fontSize: '16px' }}>Xác thực sinh viên bằng email trường</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>✓</div>
              <span style={{ fontSize: '16px' }}>Tìm kiếm nhà trên bản đồ</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>✓</div>
              <span style={{ fontSize: '16px' }}>Đánh giá và bình luận minh bạch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Forms */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '450px'
        }}>
          {view === 'login' && (
            <Login 
              onSuccess={handleLoginSuccess}
              onSwitchToRegister={() => setView('register')}
            />
          )}

          {view === 'register' && (
            <Register 
              onSuccess={handleRegisterSuccess}
              onSwitchToLogin={() => setView('login')}
            />
          )}

          {view === 'emailVerification' && tempUser && (
            <EmailVerification 
              email={tempUser.email}
              onBack={() => setView('login')}
            />
          )}

          {view === 'personalInfo' && tempUser && (
            <PersonalInfo 
              user={tempUser}
              onComplete={handleProfileComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;