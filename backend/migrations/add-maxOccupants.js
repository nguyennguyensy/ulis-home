/**
 * Migration: Add maxOccupants to existing houses
 * 
 * This script updates all existing houses to have maxOccupants based on roomType:
 * - single: maxOccupants = 1
 * - double: maxOccupants = 2
 * - If no roomType, defaults to single (maxOccupants = 1)
 * 
 * Usage: node migrations/add-maxOccupants.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const houseSchema = new mongoose.Schema({
  landlordId: String,
  title: String,
  description: String,
  address: String,
  location: {
    lat: Number,
    lng: Number
  },
  price: Number,
  electricityPrice: Number,
  waterPrice: Number,
  costs: [{
    name: String,
    price: Number,
    unit: String
  }],
  roomType: String,
  maxOccupants: Number,
  currentOccupants: Number,
  isAvailable: Boolean,
  area: Number,
  images: [String],
  amenities: [String],
  reviews: [{
    id: String,
    userId: String,
    rating: Number,
    comment: String,
    createdAt: Date,
    updatedAt: Date,
    isEdited: Boolean
  }],
  averageRating: Number,
  totalReviews: Number,
  createdAt: Date
}, {
  timestamps: true
});

const House = mongoose.model('House', houseSchema);

async function migrate() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all houses without maxOccupants
    const housesWithoutMax = await House.find({ 
      maxOccupants: { $exists: false } 
    });
    
    console.log(`📊 Found ${housesWithoutMax.length} houses without maxOccupants`);

    if (housesWithoutMax.length === 0) {
      console.log('✅ All houses already have maxOccupants. Nothing to update.');
      return;
    }

    // Update each house
    let updated = 0;
    for (const house of housesWithoutMax) {
      let maxOccupants = 1; // Default to single
      
      if (house.roomType === 'double') {
        maxOccupants = 2;
      } else if (house.roomType === 'dorm') {
        maxOccupants = 4; // or whatever you prefer for dorm
      }

      // Also set roomType if it doesn't exist
      if (!house.roomType) {
        house.roomType = 'single';
      }

      house.maxOccupants = maxOccupants;
      await house.save();
      
      updated++;
      console.log(`✅ Updated house ${house._id}: roomType=${house.roomType}, maxOccupants=${maxOccupants}`);
    }

    console.log(`\n🎉 Migration completed! Updated ${updated} houses.`);
    
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
