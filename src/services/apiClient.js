import { auth } from '../firebase/config';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class ApiClient {
  async getToken() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Not authenticated');
    }
    return await user.getIdToken();
  }

  async request(endpoint, options = {}, retryCount = 0) {
    const MAX_RETRIES = 2;
    
    try {
      const token = await this.getToken();
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      };

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.error || response.statusText;
        
        // Retry on server errors (500+) or when MongoDB might be sleeping
        if (response.status >= 500 && retryCount < MAX_RETRIES) {
          console.log(`🔄 Retrying request (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          return this.request(endpoint, options, retryCount + 1);
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      // Retry on network errors or fetch failures
      if ((error.name === 'TypeError' || error.message.includes('fetch')) && retryCount < MAX_RETRIES) {
        console.log(`🔄 Network error, retrying (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.request(endpoint, options, retryCount + 1);
      }
      
      // Log as warning if "House not found" (expected when house is deleted or DB sleeping)
      if (error.message?.includes('House not found')) {
        console.warn('⚠️ House not found (may be deleted or DB waking up):', endpoint);
      } else {
        console.error('API Error:', error);
      }
      throw error;
    }
  }

  // User endpoints
  async createUser(data) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser() {
    return this.request('/users/me');
  }

  async getUser(userId) {
    return this.request(`/users/${userId}`);
  }

  async updateUser(userId, data) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getAllUsers() {
    return this.request('/users');
  }

  async getSimilarRoommates(houseId, userId) {
    return this.request('/users/similar-roommates', {
      method: 'POST',
      body: JSON.stringify({ houseId, userId }),
    });
  }

  // House endpoints
  async getHouses() {
    return this.request('/houses');
  }

  async getHouse(houseId) {
    return this.request(`/houses/${houseId}`);
  }

  async getHousesByLandlord(landlordId) {
    return this.request(`/houses/landlord/${landlordId}`);
  }

  async createHouse(data) {
    return this.request('/houses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateHouse(houseId, data) {
    return this.request(`/houses/${houseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteHouse(houseId) {
    return this.request(`/houses/${houseId}`, {
      method: 'DELETE',
    });
  }

  async addReview(houseId, data) {
    return this.request(`/houses/${houseId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Reservation endpoints
  async createReservation(houseId) {
    return this.request('/reservations', {
      method: 'POST',
      body: JSON.stringify({ houseId }),
    });
  }

  async getStudentReservations(studentId) {
    return this.request(`/reservations/student/${studentId}`);
  }

  async getStudentReservationForHouse(studentId, houseId) {
    return this.request(`/reservations/student/${studentId}/house/${houseId}`);
  }

  async getHouseReservations(houseId) {
    return this.request(`/reservations/house/${houseId}`);
  }

  async updateReservationStatus(reservationId, status) {
    return this.request(`/reservations/${reservationId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteReservation(reservationId) {
    return this.request(`/reservations/${reservationId}`, {
      method: 'DELETE',
    });
  }

  async getApprovedHouses(studentId) {
    return this.request(`/reservations/student/${studentId}/approved`);
  }

  // Conversation endpoints
  async getUserConversations(userId) {
    return this.request(`/conversations/user/${userId}`);
  }

  async getConversation(conversationId) {
    return this.request(`/conversations/${conversationId}`);
  }

  async createConversation(participantId) {
    return this.request('/conversations', {
      method: 'POST',
      body: JSON.stringify({ participantId }),
    });
  }

  async sendMessage(conversationId, text, participantId = null) {
    const body = { text };
    if (participantId) {
      body.participantId = participantId;
    }
    return this.request(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getMessages(conversationId) {
    return this.request(`/conversations/${conversationId}/messages`);
  }

  async markMessagesAsRead(conversationId) {
    return this.request(`/conversations/${conversationId}/read`, {
      method: 'POST',
    });
  }

  async getUnreadCount(userId) {
    return this.request(`/conversations/user/${userId}/unread`);
  }
}

export default new ApiClient();
