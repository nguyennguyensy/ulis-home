const mongoose = require('mongoose');
const User = require('../src/models/User');
const House = require('../src/models/House');
const Reservation = require('../src/models/Reservation');
const Conversation = require('../src/models/Conversation');

// Load environment variables
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ulis-home';
const NODE_ENV = process.env.NODE_ENV || 'development';

async function clearDatabase() {
  try {
    // SAFETY CHECK: Prevent running on production
    if (NODE_ENV === 'production') {
      console.error('❌ CANNOT run this script in production environment!');
      console.error('💡 If you really need to clear production data, change NODE_ENV temporarily.');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 Environment:', NODE_ENV);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Count documents before deletion
    const userCount = await User.countDocuments();
    const houseCount = await House.countDocuments();
    const reservationCount = await Reservation.countDocuments();
    const conversationCount = await Conversation.countDocuments();

    console.log('\n📊 Current database state:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Houses: ${houseCount}`);
    console.log(`   Reservations: ${reservationCount}`);
    console.log(`   Conversations: ${conversationCount}`);

    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will delete ALL data from the database!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete all documents
    console.log('🗑️  Deleting all data...');
    
    await User.deleteMany({});
    console.log('✅ Users deleted');
    
    await House.deleteMany({});
    console.log('✅ Houses deleted');
    
    await Reservation.deleteMany({});
    console.log('✅ Reservations deleted');
    
    await Conversation.deleteMany({});
    console.log('✅ Conversations deleted');

    console.log('\n✨ Database cleared successfully!');
    console.log('🔥 All test data has been removed.');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

clearDatabase();
