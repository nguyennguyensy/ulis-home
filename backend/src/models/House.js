const mongoose = require('mongoose');

const houseSchema = new mongoose.Schema({
  landlordId: { 
    type: String, 
    required: true
  },
  title: { 
    type: String, 
    required: true 
  },
  description: String,
  address: { 
    type: String, 
    required: true 
  },
  location: {
    lat: Number,
    lng: Number
  },
  price: { 
    type: Number, 
    required: true 
  },
  electricityPrice: Number,
  waterPrice: Number,
  costs: [{
    name: String,
    price: Number,
    unit: String
  }],
  roomType: { type: String, default: 'single' }, // 'single', 'double', 'dorm'
  maxOccupants: { type: Number, default: 1 }, // Maximum people who can live (1 for single, 2 for double, etc.)
  currentOccupants: { type: Number, default: 0 }, // Currently approved tenants
  isAvailable: { type: Boolean, default: true }, // False when fully occupied
  area: Number,
  images: [String],
  amenities: [String],
  reviews: [{
    id: String,
    userId: String,
    rating: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
    isEdited: { type: Boolean, default: false }
  }],
  averageRating: { 
    type: Number, 
    default: 0 
  },
  totalReviews: { 
    type: Number, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Index for searching
houseSchema.index({ address: 'text', title: 'text' });
houseSchema.index({ landlordId: 1 });

module.exports = mongoose.model('House', houseSchema);
