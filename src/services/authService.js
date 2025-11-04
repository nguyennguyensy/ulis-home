import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { ROLES } from '../utils/authConstants';
import apiClient from './apiClient';

class AuthService {
  constructor() {
    this.unsubscribe = null;
  }

  // Initialize auth state listener
  initAuthListener(callback) {
    this.unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await apiClient.getCurrentUser();
          
          // Skip email verification check - proceed directly
          callback({
            id: firebaseUser.uid,
            ...user,
            emailVerified: true
          });
        } catch (error) {
          console.error('Failed to load user:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  removeAuthListener() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  async register(email, password, role) {
    try {
      console.log('🔵 Starting registration for:', email, 'role:', role);
      
      // Validate email for students
      if (role === ROLES.STUDENT && !email.endsWith('.edu.vn')) {
        throw new Error('Sinh viên phải sử dụng email trường có đuôi .edu.vn');
      }

      // Create Firebase Auth user
      console.log('🔵 Creating Firebase user...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase user created:', firebaseUser.uid);

      // Create user in MongoDB
      const userData = {
        email,
        role,
        isProfileComplete: false,
        emailVerified: false
      };

      console.log('🔵 Creating MongoDB user...');
      const user = await apiClient.createUser(userData);
      console.log('✅ MongoDB user created');

      // Skip email verification - no longer needed
      console.log('✅ Registration completed successfully (email verification disabled)');
      
      return {
        id: firebaseUser.uid,
        ...user,
        emailVerified: true
      };
    } catch (error) {
      console.error('❌ Register error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email đã được sử dụng');
      }
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại');
      }
      if (error.message && error.message.includes('fetch')) {
        throw new Error('Không thể kết nối đến server. Vui lòng thử lại sau');
      }
      throw error;
    }
  }

  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Skip email verification check - allow login immediately
      const user = await apiClient.getCurrentUser();
      
      if (!user) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }

      // Update emailVerified status
      if (!user.emailVerified) {
        await apiClient.updateUser(firebaseUser.uid, {
          emailVerified: true
        });
      }

      return {
        id: firebaseUser.uid,
        ...user,
        emailVerified: true
      };
    } catch (error) {
      console.error('Login error:', error);
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        throw new Error('Vui lòng xác thực email trước khi đăng nhập. Kiểm tra hộp thư của bạn.');
      }
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Email hoặc mật khẩu không đúng');
      }
      if (error.code === 'auth/invalid-credential') {
        throw new Error('Email hoặc mật khẩu không đúng');
      }
      throw error;
    }
  }

  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async deleteIncompleteUser(userId) {
    try {
      // Delete from Firebase Auth
      const firebaseUser = auth.currentUser;
      if (firebaseUser && firebaseUser.uid === userId) {
        await firebaseUser.delete();
      }
      
      // Delete from MongoDB
      await apiClient.deleteUser(userId);
      
      console.log('✅ Incomplete user deleted:', userId);
    } catch (error) {
      console.error('Delete incomplete user error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    try {
      const user = await apiClient.getCurrentUser();
      return {
        id: firebaseUser.uid,
        ...user
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async updateUser(userId, data) {
    try {
      console.log('🔵 updateUser called with:', { userId, data });
      const user = await apiClient.updateUser(userId, data);
      console.log('✅ Update successful:', user);
      return {
        id: userId,
        ...user
      };
    } catch (error) {
      console.error('❌ Update user error:', error);
      console.error('Error details:', error.message, error.response);
      throw error;
    }
  }

  async completeProfile(userId, profileData) {
    return await this.updateUser(userId, {
      ...profileData,
      isProfileComplete: true
    });
  }

  async getUser(userId) {
    try {
      const user = await apiClient.getUser(userId);
      return {
        id: userId,
        ...user
      };
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  async getAllUsers() {
    try {
      return await apiClient.getAllUsers();
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  }

  async getSimilarRoommates(houseId, userId) {
    try {
      return await apiClient.getSimilarRoommates(houseId, userId);
    } catch (error) {
      console.error('Get similar roommates error:', error);
      return [];
    }
  }

  async getHouseStudents(houseId) {
    try {
      return await apiClient.getHouseStudents(houseId);
    } catch (error) {
      console.error('Get house students error:', error);
      return [];
    }
  }

  isAuthenticated() {
    return auth.currentUser !== null;
  }
}

const authService = new AuthService();
export default authService;