import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthContainer from './components/auth/AuthContainer';
import authService from './services/authService';
import { ROLES } from './utils/authConstants';
import LandlordDashboard from './components/landlord/LandlordDashboard';
import PublicProfile from './components/shared/PublicProfile';
import { ToastProvider } from './components/shared/ToastProvider';
const StudentDashboard = lazy(() => import('./components/student/StudentDashboard').then(mod => {
  try { console.log('DYNAMIC IMPORT -> StudentDashboard module:', mod); } catch (e) {}
  return mod;
}));
  try {
    console.log('IMPORT CHECK -> AuthContainer:', typeof AuthContainer, AuthContainer && AuthContainer.name ? AuthContainer.name : AuthContainer);
    console.log('IMPORT CHECK -> StudentDashboard:', typeof StudentDashboard, StudentDashboard && StudentDashboard.name ? StudentDashboard.name : StudentDashboard);
    console.log('IMPORT CHECK -> LandlordDashboard:', typeof LandlordDashboard, LandlordDashboard && LandlordDashboard.name ? LandlordDashboard.name : LandlordDashboard);
    console.log('IMPORT CHECK -> ROLES:', typeof ROLES, ROLES);
  } catch (e) {
    console.warn('IMPORT CHECK error', e);
  }

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // (removed safeCreate helper) render components directly below

  useEffect(() => {
    // Use auth state listener so app waits for Firebase auth persistence on reload
    authService.initAuthListener((user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });

    return () => {
      authService.removeAuthListener();
    };
  }, []);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #E5E7EB',
            borderTopColor: '#4F46E5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ fontSize: '14px', color: '#6B7280' }}>Đang tải...</p>
          <style>
            {`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  // Show auth screen if no user OR if user needs email verification OR profile incomplete
  if (!currentUser || currentUser.requiresEmailVerification || !currentUser.isProfileComplete) {
    return <AuthContainer onAuthSuccess={handleAuthSuccess} currentUser={currentUser} />;
  }

  const renderDashboard = () => {
    if (!currentUser || !currentUser.role) {
      return null;
    }
    console.log('currentUser:', currentUser);
    console.log('ROLES:', ROLES);
    console.log('currentUser.role:', currentUser.role);
    console.log('ROLES.STUDENT:', ROLES.STUDENT);
    // Debug types of dashboard components (helps identify object vs function)
    try {
      console.log('AuthContainer type:', typeof AuthContainer, AuthContainer && AuthContainer.name ? AuthContainer.name : AuthContainer);
      console.log('StudentDashboard type:', typeof StudentDashboard, StudentDashboard && StudentDashboard.name ? StudentDashboard.name : StudentDashboard);
      console.log('LandlordDashboard type:', typeof LandlordDashboard, LandlordDashboard && LandlordDashboard.name ? LandlordDashboard.name : LandlordDashboard);
    } catch (e) {
      console.warn('Error logging component types', e);
    }
    
    if (currentUser.role === ROLES.STUDENT) {
      return (
          <Suspense fallback={<div style={{ padding: 24 }}>Đang tải...</div>}>
          <StudentDashboard currentUser={currentUser} onLogout={handleLogout} onUserUpdate={setCurrentUser} />
        </Suspense>
      );
    }
    if (currentUser.role === ROLES.LANDLORD) {
      return <LandlordDashboard currentUser={currentUser} onLogout={handleLogout} onUserUpdate={setCurrentUser} />;
    }
    return null;
  };

  return (
    <Router>
      <ToastProvider>
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
          <Routes>
            <Route path="/" element={renderDashboard()} />
            <Route path="/u/:userId" element={<PublicProfile currentUser={currentUser} />} />
            <Route path="/profile/:userId" element={<PublicProfile currentUser={currentUser} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Logout moved into dashboards' headers */}
        </div>
      </ToastProvider>
    </Router>
  );
}

export default App;