/**
 * Migration: Add readBy field to existing messages
 * 
 * This script adds readBy array to all existing messages:
 * - Sender is automatically added to readBy
 * - For older messages, we assume all messages are read by all participants
 * 
 * Usage: node migrations/add-readBy-to-messages.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const conversationSchema = new mongoose.Schema({
  participants: [String],
  lastMessage: {
    text: String,
    senderId: String,
    timestamp: Date
  },
  messages: [{
    id: String,
    senderId: String,
    text: String,
    timestamp: Date,
    readBy: [String]
  }],
  createdAt: Date
}, {
  timestamps: true
});

const Conversation = mongoose.model('Conversation', conversationSchema);

async function migrate() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all conversations
    const conversations = await Conversation.find({});
    
    console.log(`📊 Found ${conversations.length} conversations`);

    if (conversations.length === 0) {
      console.log('✅ No conversations to update.');
      return;
    }

    // Update each conversation
    let updatedConversations = 0;
    let updatedMessages = 0;

    for (const conv of conversations) {
      let hasChanges = false;

      // Update messages without readBy
      conv.messages.forEach(msg => {
        if (!msg.readBy || msg.readBy.length === 0) {
          // Add sender to readBy (they've read their own message)
          msg.readBy = [msg.senderId];
          
          // For older messages, mark as read by all participants
          // (assumption: they've already seen it)
          conv.participants.forEach(participantId => {
            if (!msg.readBy.includes(participantId)) {
              msg.readBy.push(participantId);
            }
          });
          
          hasChanges = true;
          updatedMessages++;
        }
      });

      if (hasChanges) {
        await conv.save();
        updatedConversations++;
        console.log(`✅ Updated conversation ${conv._id}: ${conv.messages.length} messages`);
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`   Updated ${updatedConversations} conversations`);
    console.log(`   Updated ${updatedMessages} messages`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run migration
migrate();
