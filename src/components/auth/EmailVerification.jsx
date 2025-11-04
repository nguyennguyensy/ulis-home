import React, { useState } from 'react';
import { Mail, CheckCircle, RefreshCw, LogOut } from 'lucide-react';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';

const EmailVerification = ({ email, onBack }) => {
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendMessage('');
    
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user, {
          url: window.location.origin + '/',
          handleCodeInApp: false
        });
        console.log('✅ Verification email resent to:', user.email);
        setResendMessage('✅ Email xác thực đã được gửi lại! Kiểm tra hộp thư của bạn.');
      } else {
        setResendMessage('❌ Không tìm thấy người dùng. Vui lòng đăng ký lại.');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setResendMessage('❌ Không thể gửi lại email. Vui lòng thử lại sau.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    setResendMessage('');
    
    try {
      const user = auth.currentUser;
      if (user) {
        // Reload user to get latest emailVerified status
        await user.reload();
        
        if (user.emailVerified) {
          setResendMessage('✅ Email đã được xác thực! Đang tải lại trang...');
          // Wait a moment then reload to trigger auth listener
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setResendMessage('⚠️ Email chưa được xác thực. Vui lòng kiểm tra hộp thư và click vào link.');
        }
      }
    } catch (error) {
      console.error('Check verification error:', error);
      setResendMessage('❌ Không thể kiểm tra trạng thái. Vui lòng thử lại.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (onBack) onBack();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '40px',
      borderRadius: '16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      maxWidth: '480px',
      margin: '0 auto'
    }}>
      {/* Icon */}
      <div style={{
        width: '80px',
        height: '80px',
        margin: '0 auto 24px',
        backgroundColor: '#EEF2FF',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Mail size={40} color="#4F46E5" />
      </div>

      {/* Title */}
      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '16px',
        color: '#111827',
        textAlign: 'center'
      }}>
        Xác thực email của bạn
      </h2>

      {/* Description */}
      <p style={{
        fontSize: '14px',
        color: '#6B7280',
        marginBottom: '24px',
        textAlign: 'center',
        lineHeight: '1.6'
      }}>
        Chúng tôi đã gửi email xác thực đến:
      </p>

      <div style={{
        padding: '12px 16px',
        backgroundColor: '#F9FAFB',
        borderRadius: '8px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <span style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#4F46E5'
        }}>
          {email}
        </span>
      </div>

      {/* Instructions */}
      <div style={{
        padding: '16px',
        backgroundColor: '#EEF2FF',
        borderRadius: '8px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <CheckCircle size={20} color="#4F46E5" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
            Mở email và click vào link xác thực
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <CheckCircle size={20} color="#4F46E5" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
            Sau khi xác thực, quay lại trang này và đăng nhập
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <CheckCircle size={20} color="#4F46E5" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
            Kiểm tra cả thư mục Spam nếu không thấy email
          </p>
        </div>
      </div>

      {/* Resend Message */}
      {resendMessage && (
        <div style={{
          padding: '12px',
          backgroundColor: resendMessage.startsWith('✅') ? '#D1FAE5' : '#FEE2E2',
          color: resendMessage.startsWith('✅') ? '#065F46' : '#991B1B',
          borderRadius: '8px',
          fontSize: '14px',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          {resendMessage}
        </div>
      )}

      {/* Check Verification Button */}
      <button
        onClick={handleCheckVerification}
        disabled={isChecking}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#10B981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: isChecking ? 'not-allowed' : 'pointer',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (!isChecking) {
            e.target.style.backgroundColor = '#059669';
          }
        }}
        onMouseLeave={(e) => {
          if (!isChecking) {
            e.target.style.backgroundColor = '#10B981';
          }
        }}
      >
        <CheckCircle size={16} />
        {isChecking ? 'Đang kiểm tra...' : 'Tôi đã xác thực email'}
      </button>

      {/* Resend Button */}
      <button
        onClick={handleResendEmail}
        disabled={isResending}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: 'white',
          color: '#4F46E5',
          border: '2px solid #4F46E5',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: isResending ? 'not-allowed' : 'pointer',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (!isResending) {
            e.target.style.backgroundColor = '#EEF2FF';
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'white';
        }}
      >
        <RefreshCw size={16} style={{ animation: isResending ? 'spin 1s linear infinite' : 'none' }} />
        {isResending ? 'Đang gửi...' : 'Gửi lại email xác thực'}
      </button>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: 'white',
          color: '#6B7280',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#F9FAFB';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'white';
        }}
      >
        <LogOut size={16} />
        Đăng xuất
      </button>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EmailVerification;
