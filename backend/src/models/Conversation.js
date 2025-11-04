const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ 
    type: String, 
    required: true 
  }],
  lastMessage: {
    text: String,
    senderId: String,
    timestamp: Date
  },
  messages: [{
    id: String,
    senderId: String,
    text: String,
    timestamp: { type: Date, default: Date.now },
    readBy: [{ type: String }] // Array of userIds who have read this message
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Index for finding conversations by participant
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
