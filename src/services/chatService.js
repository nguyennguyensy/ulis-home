import apiClient from './apiClient';

class ChatService {
  constructor() {
    this.listeners = new Map();
  }

  // createIfNotExists: if false, only returns an existing conversation (does NOT create a new one)
  async createConversation(user1Id, user2Id, createIfNotExists = true) {
    try {
      // Check if conversation already exists
      const existingConv = await this.getConversation(user1Id, user2Id);
      if (existingConv) {
        return existingConv;
      }

      if (!createIfNotExists) return null;

      const conversation = await apiClient.createConversation({
        participants: [user1Id, user2Id]
      });

      return {
        id: conversation._id,
        ...conversation
      };
    } catch (error) {
      console.error('Create conversation error:', error);
      throw error;
    }
  }

  async getConversation(user1Id, user2Id) {
    try {
      const conversations = await apiClient.getUserConversations(user1Id);
      const conversation = conversations.find(c => 
        c.participants.includes(user2Id)
      );
      
      if (conversation) {
        return {
          id: conversation._id,
          ...conversation
        };
      }
      
      return null;
    } catch (error) {
      console.error('Get conversation error:', error);
      return null;
    }
  }

  async getUserConversations(userId) {
    try {
      const conversations = await apiClient.getUserConversations(userId);
      
      return conversations.map(c => ({
        id: c._id,
        ...c
      })).sort((a, b) => {
        const timeA = new Date(a.lastMessageAt || 0).getTime();
        const timeB = new Date(b.lastMessageAt || 0).getTime();
        return timeB - timeA;
      });
    } catch (error) {
      console.error('Get user conversations error:', error);
      return [];
    }
  }

  // sendMessage: if conversationId is provided, append to it; if not provided, participants must be given and a new conversation will be created.
  // Returns { message, conversationId }
  async sendMessage(conversationId, senderId, content, participants = null) {
    try {
      let finalConversationId = conversationId;

      if (!finalConversationId) {
        // Create a new conversation if not provided
        if (!participants || participants.length < 2) {
          throw new Error('Missing participants to create conversation');
        }

        // Find the other participant (not the sender)
        const otherParticipant = participants.find(p => p !== senderId);
        if (!otherParticipant) {
          throw new Error('Cannot find other participant');
        }

        console.log('🔵 Creating conversation with participantId:', otherParticipant);
        const conversation = await apiClient.createConversation(otherParticipant);
        finalConversationId = conversation._id;
        console.log('✅ Conversation created:', finalConversationId);
      }

      console.log('📤 Sending message to conversation:', finalConversationId);
      const result = await apiClient.sendMessage(finalConversationId, content);

      return { 
        message: result.message, 
        conversationId: finalConversationId 
      };
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  async markMessagesAsRead(conversationId, userId) {
    try {
      await apiClient.markMessagesAsRead(conversationId);
      console.log('✅ Marked messages as read for conversation:', conversationId);
    } catch (error) {
      console.error('Mark messages as read error:', error);
    }
  }

  async getUnreadCount(userId) {
    try {
      const conversations = await this.getUserConversations(userId);
      let unreadCount = 0;
      
      for (const conv of conversations) {
        const unreadInConv = (conv.messages || []).filter(
          msg => msg.senderId !== userId && 
                 (!msg.readBy || !msg.readBy.includes(userId))
        ).length;
        unreadCount += unreadInConv;
      }
      
      console.log(`📊 Frontend getUnreadCount: ${unreadCount} unread messages for user ${userId}`);
      return unreadCount;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  // Realtime listener for conversation (polling-based)
  subscribeToConversation(conversationId, callback) {
    let intervalId = null;
    
    const fetchConversation = async () => {
      try {
        const conversations = await apiClient.getUserConversations('dummy'); // Will need conversation by ID endpoint
        const conversation = conversations.find(c => c._id === conversationId);
        
        if (conversation) {
          callback({
            id: conversation._id,
            ...conversation
          });
        }
      } catch (error) {
        console.error('Fetch conversation error:', error);
      }
    };

    // Initial fetch
    fetchConversation();
    
    // Poll every 3 seconds
    intervalId = setInterval(fetchConversation, 3000);

    const unsubscribe = () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };

    this.listeners.set(conversationId, unsubscribe);
    return unsubscribe;
  }

  // Realtime listener for a user's conversation list (polling-based)
  subscribeToUserConversations(userId, callback) {
    const key = `user:${userId}`;
    // Unsubscribe previous if exists
    const existing = this.listeners.get(key);
    if (existing) existing();

    let intervalId = null;
    
    const fetchConversations = async () => {
      try {
        const conversations = await apiClient.getUserConversations(userId);
        const mappedConversations = conversations.map(c => ({ 
          id: c._id, 
          ...c 
        }));
        callback(mappedConversations);
      } catch (error) {
        console.error('Fetch conversations error:', error);
      }
    };

    // Initial fetch
    fetchConversations();
    
    // Poll every 3 seconds
    intervalId = setInterval(fetchConversations, 3000);

    const unsubscribe = () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };

    this.listeners.set(key, unsubscribe);
    return unsubscribe;
  }

  // Unsubscribe from conversation
  unsubscribeFromConversation(conversationId) {
    const unsubscribe = this.listeners.get(conversationId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(conversationId);
    }
  }

  // Cleanup all listeners
  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

const chatService = new ChatService();
export default chatService;