const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const { verifyToken } = require('../middleware/auth');

// Get user conversations
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.params.userId
    }).sort({ 'lastMessage.timestamp': -1 });
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get conversation by ID
router.get('/:conversationId', verifyToken, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create conversation
router.post('/', verifyToken, async (req, res) => {
  try {
    console.log('🔵 Create conversation - req.body:', req.body);
    const { participantId } = req.body;
    const userId = req.user.uid;
    
    if (!participantId) {
      return res.status(400).json({ error: 'participantId is required' });
    }
    
    console.log('👥 Creating conversation between:', userId, 'and', participantId);
    
    // Check if conversation already exists
    const existing = await Conversation.findOne({
      participants: { $all: [userId, participantId] }
    });
    
    if (existing) {
      console.log('✅ Found existing conversation:', existing._id);
      return res.json(existing);
    }
    
    const conversation = new Conversation({
      participants: [userId, participantId],
      messages: []
    });
    
    await conversation.save();
    console.log('✅ New conversation created:', conversation._id);
    res.status(201).json(conversation);
  } catch (error) {
    console.error('❌ Create conversation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send message
router.post('/:conversationId/messages', verifyToken, async (req, res) => {
  try {
    console.log('📤 Send message - conversationId:', req.params.conversationId, 'body:', req.body);
    const { text } = req.body;
    const senderId = req.user.uid;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    
    let conversation = await Conversation.findById(req.params.conversationId);
    
    // If conversation doesn't exist, create it
    if (!conversation && req.body.participantId) {
      console.log('🆕 Creating conversation on-the-fly with participant:', req.body.participantId);
      conversation = new Conversation({
        participants: [senderId, req.body.participantId],
        messages: []
      });
    }
    
    if (!conversation) {
      console.error('❌ Conversation not found:', req.params.conversationId);
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    const message = {
      id: `msg_${Date.now()}`,
      senderId,
      text: text.trim(),
      timestamp: new Date(),
      readBy: [senderId] // Sender automatically marks as read
    };
    
    conversation.messages.push(message);
    conversation.lastMessage = {
      text: text.trim(),
      senderId,
      timestamp: message.timestamp
    };
    
    await conversation.save();
    console.log('✅ Message sent:', message.id);
    
    res.json({
      message,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error('❌ Send message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get conversation messages
router.get('/:conversationId/messages', verifyToken, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json(conversation.messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark messages as read
router.post('/:conversationId/read', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Mark all messages not sent by this user as read
    let updated = 0;
    conversation.messages.forEach(message => {
      if (message.senderId !== userId && !message.readBy.includes(userId)) {
        message.readBy.push(userId);
        updated++;
      }
    });
    
    if (updated > 0) {
      await conversation.save();
      console.log(`✅ Marked ${updated} messages as read for user ${userId}`);
    }
    
    res.json({ success: true, markedCount: updated });
  } catch (error) {
    console.error('❌ Mark as read error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
router.get('/user/:userId/unread', verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('📊 Getting unread count for user:', userId);
    
    // Find all conversations where user is a participant
    const conversations = await Conversation.find({
      participants: userId
    });
    
    console.log(`📋 Found ${conversations.length} conversations`);
    
    let totalUnread = 0;
    conversations.forEach(conv => {
      let convUnread = 0;
      conv.messages.forEach(msg => {
        // Count messages not sent by user and not read by user
        if (msg.senderId !== userId && !msg.readBy.includes(userId)) {
          totalUnread++;
          convUnread++;
          console.log(`    Message ${msg.id}: sender=${msg.senderId}, readBy=[${msg.readBy.join(', ')}]`);
        }
      });
      if (convUnread > 0) {
        console.log(`  Conversation ${conv._id}: ${convUnread} unread messages`);
      }
    });
    
    console.log(`✅ Total unread: ${totalUnread}`);
    res.json({ count: totalUnread });
  } catch (error) {
    console.error('❌ Get unread count error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
