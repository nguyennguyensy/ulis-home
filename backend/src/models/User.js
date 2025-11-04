const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: String,
  age: Number,
  phone: String,
  address: String,
  role: { 
    type: String, 
    enum: ['student', 'landlord'],
    required: true 
  },
  avatar: String,
  idCard: String,
  roommatePreference: String,
  roommateProfile: {
    cleanliness: { type: Number, min: 1, max: 5 },
    noiseLevel: { type: Number, min: 1, max: 5 },
    sleepSchedule: String,
    hobbies: [String]
  },
  isProfileComplete: { 
    type: Boolean, 
    default: false 
  },
  emailVerified: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
