import { RESERVATION_STATUS } from '../utils/constants';
import apiClient from './apiClient';

class HouseService {
  // Process images - keep base64 or external URLs
  processImages(images) {
    return images.map(img => {
      // If base64, keep as is (limit to reasonable size)
      if (img.url && img.url.startsWith('data:')) {
        return img.url;
      }
      // If external URL, keep as is
      return img.url || img;
    });
  }

  async createHouse(landlordId, houseData) {
    try {
      // Process images (base64 or URLs)
      let imageUrls = [];
      if (houseData.images && houseData.images.length > 0) {
        imageUrls = this.processImages(houseData.images);
      }

      const house = {
        ...houseData,
        images: imageUrls,
        reviews: [],
        averageRating: 0,
        totalReviews: 0
      };

      const result = await apiClient.createHouse(house);
      return {
        id: result._id,
        ...result
      };
    } catch (error) {
      console.error('Create house error:', error);
      throw error;
    }
  }

  async getHouse(houseId) {
    try {
      const house = await apiClient.getHouse(houseId);
      return house ? { id: house._id, ...house } : null;
    } catch (error) {
      // Silently return null for "House not found" - apiClient already logged it
      if (error.message?.includes('House not found')) {
        return null;
      }
      console.error('Get house error:', error);
      return null;
    }
  }

  async updateHouse(houseId, data) {
    try {
      // Upload new images if provided
      if (data.images && data.images.length > 0 && data.images[0].url?.startsWith('data:')) {
        data.images = this.processImages(data.images);
      }

      const house = await apiClient.updateHouse(houseId, data);
      return {
        id: house._id,
        ...house
      };
    } catch (error) {
      console.error('Update house error:', error);
      throw error;
    }
  }

  async deleteHouse(houseId) {
    try {
      await apiClient.deleteHouse(houseId);
      return true;
    } catch (error) {
      console.error('Delete house error:', error);
      return false;
    }
  }

  async getAllHouses() {
    try {
      const houses = await apiClient.getHouses();
      return houses.map(house => ({
        id: house._id,
        ...house
      }));
    } catch (error) {
      console.error('Get all houses error:', error);
      return [];
    }
  }

  async getHousesByLandlord(landlordId) {
    try {
      const houses = await apiClient.getHousesByLandlord(landlordId);
      return houses.map(house => ({
        id: house._id,
        ...house
      }));
    } catch (error) {
      console.error('Get houses by landlord error:', error);
      return [];
    }
  }

  async addReview(houseId, userId, rating, comment) {
    try {
      // Backend derives userId from token, only send rating and comment
      const house = await apiClient.addReview(houseId, { rating, comment });
      return {
        id: house._id,
        reviews: house.reviews,
        rating: house.rating
      };
    } catch (error) {
      console.error('Add review error:', error);
      throw error;
    }
  }

  async createReservation(studentId, houseId) {
    try {
      // Backend derives studentId from the authenticated token, so only send houseId
      const reservation = await apiClient.createReservation(houseId);
      return {
        id: reservation._id,
        ...reservation
      };
    } catch (error) {
      console.error('Create reservation error:', error);
      throw error;
    }
  }

  async deleteReservation(reservationId) {
    try {
      await apiClient.deleteReservation(reservationId);
      return true;
    } catch (error) {
      console.error('Delete reservation error:', error);
      return false;
    }
  }

  async updateReservationStatus(reservationId, status) {
    try {
      const reservation = await apiClient.updateReservationStatus(reservationId, status);
      return {
        id: reservation._id,
        ...reservation
      };
    } catch (error) {
      console.error('Update reservation status error:', error);
      throw error;
    }
  }

  async getStudentReservations(studentId) {
    try {
      const reservations = await apiClient.getStudentReservations(studentId);
      
      // Check and update expired reservations
      const updates = [];
      for (const reservation of reservations) {
        if (reservation.status === RESERVATION_STATUS.PENDING && 
            Date.now() > new Date(reservation.expiresAt).getTime()) {
          updates.push(
            apiClient.updateReservationStatus(reservation._id, RESERVATION_STATUS.EXPIRED)
          );
          reservation.status = RESERVATION_STATUS.EXPIRED;
        }
      }
      await Promise.all(updates);

      return reservations.map(r => ({ id: r._id, ...r }));
    } catch (error) {
      console.error('Get student reservations error:', error);
      return [];
    }
  }

  async getStudentReservationForHouse(studentId, houseId) {
    try {
      const reservations = await apiClient.getStudentReservations(studentId);
      const reservation = reservations.find(r => r.houseId === houseId);
      
      if (reservation) {
        return {
          id: reservation._id,
          ...reservation
        };
      }
      return null;
    } catch (error) {
      console.error('Get student reservation for house error:', error);
      return null;
    }
  }

  subscribeStudentReservationForHouse(studentId, houseId, callback) {
    let intervalId = null;
    
    const fetchReservation = async () => {
      try {
        const reservations = await apiClient.getStudentReservations(studentId);
        const reservation = reservations.find(r => r.houseId === houseId);
        
        if (reservation) {
          callback({ id: reservation._id, ...reservation });
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('Fetch reservation error:', error);
      }
    };

    // Initial fetch
    fetchReservation();
    
    // Poll every 5 seconds
    intervalId = setInterval(fetchReservation, 5000);

    // Return unsubscribe function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }

  async getHouseReservations(houseId) {
    try {
      const reservations = await apiClient.getHouseReservations(houseId);
      
      // Check and update expired reservations
      const updates = [];
      for (const reservation of reservations) {
        if (reservation.status === RESERVATION_STATUS.PENDING && 
            Date.now() > new Date(reservation.expiresAt).getTime()) {
          updates.push(
            apiClient.updateReservationStatus(reservation._id, RESERVATION_STATUS.EXPIRED)
          );
          reservation.status = RESERVATION_STATUS.EXPIRED;
        }
      }
      await Promise.all(updates);

      return reservations.map(r => ({ id: r._id, ...r }));
    } catch (error) {
      console.error('Get house reservations error:', error);
      return [];
    }
  }

  async getApprovedHouses(studentId) {
    try {
      const reservations = await apiClient.getStudentReservations(studentId);
      const approvedReservations = reservations.filter(r => r.status === RESERVATION_STATUS.APPROVED);
      
      const houses = [];
      for (const reservation of approvedReservations) {
        const house = await this.getHouse(reservation.houseId);
        if (house) {
          houses.push({ ...house, reservationId: reservation._id });
        }
      }
      
      return houses;
    } catch (error) {
      console.error('Get approved houses error:', error);
      return [];
    }
  }
}

const houseService = new HouseService();
export default houseService;