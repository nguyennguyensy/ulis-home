const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  studentId: { 
    type: String, 
    required: true,
    index: true 
  },
  houseId: { 
    type: String, 
    required: true,
    index: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'expired', 'waitlist'],
    default: 'pending'
  },
  expiresAt: Date,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Compound index for quick lookups
reservationSchema.index({ studentId: 1, houseId: 1 });
reservationSchema.index({ houseId: 1, status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
