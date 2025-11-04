const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const House = require('../models/House');
const { verifyToken } = require('../middleware/auth');

// Create reservation
router.post('/', verifyToken, async (req, res) => {
  try {
    const { houseId } = req.body;
    
    // Get house info
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }
    
    // Set maxOccupants based on roomType if not set
    if (!house.maxOccupants) {
      switch (house.roomType) {
        case 'single':
          house.maxOccupants = 1;
          break;
        case 'double':
          house.maxOccupants = 2;
          break;
        case 'dorm':
          house.maxOccupants = 4;
          break;
        default:
          house.maxOccupants = 1;
      }
      await house.save();
    }
    
    // Calculate max reservations allowed (5x maxOccupants)
    const maxReservations = house.maxOccupants * 5;
    
    // Count current pending + approved reservations
    const totalReservations = await Reservation.countDocuments({
      houseId,
      status: { $in: ['pending', 'approved'] }
    });
    
    // Check if house is available for new reservations
    if (!house.isAvailable || totalReservations >= maxReservations) {
      return res.status(400).json({ error: 'Phòng này đã hết chỗ đặt' });
    }
    
    // Check if student already has a pending or approved reservation for this house
    const existing = await Reservation.findOne({
      studentId: req.user.uid,
      houseId,
      status: { $in: ['pending', 'approved'] }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Bạn đã đặt phòng này rồi' });
    }
    
    const reservation = new Reservation({
      studentId: req.user.uid,
      houseId,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    await reservation.save();
    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student reservations
router.get('/student/:studentId', verifyToken, async (req, res) => {
  try {
    const reservations = await Reservation.find({ 
      studentId: req.params.studentId 
    }).sort({ createdAt: -1 });
    
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reservation for specific house by student
router.get('/student/:studentId/house/:houseId', verifyToken, async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      studentId: req.params.studentId,
      houseId: req.params.houseId
    });
    
    res.json(reservation || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get house reservations
router.get('/house/:houseId', verifyToken, async (req, res) => {
  try {
    const reservations = await Reservation.find({ 
      houseId: req.params.houseId 
    }).sort({ createdAt: -1 });
    
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update reservation status
router.put('/:reservationId', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    const reservation = await Reservation.findById(req.params.reservationId);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    const house = await House.findById(reservation.houseId);
    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }
    
    const oldStatus = reservation.status;
    
    // If approving a reservation
    if (status === 'approved' && oldStatus !== 'approved') {
      // Set maxOccupants based on roomType if not set
      if (!house.maxOccupants) {
        switch (house.roomType) {
          case 'single':
            house.maxOccupants = 1;
            break;
          case 'double':
            house.maxOccupants = 2;
            break;
          case 'dorm':
            house.maxOccupants = 4;
            break;
          default:
            house.maxOccupants = 1;
        }
      }
      
      // Check if there's space available
      if (house.currentOccupants >= house.maxOccupants) {
        return res.status(400).json({ 
          error: `Phòng đã đủ ${house.maxOccupants} người. Không thể duyệt thêm!` 
        });
      }
      
      house.currentOccupants = (house.currentOccupants || 0) + 1;
      
      console.log(`✅ Approved reservation. currentOccupants: ${house.currentOccupants}/${house.maxOccupants}`);
      
      // Check if house is now full
      if (house.currentOccupants >= house.maxOccupants) {
        house.isAvailable = false;
        
        // Auto-move all other pending reservations to waitlist
        const result = await Reservation.updateMany(
          {
            houseId: house._id,
            status: 'pending',
            _id: { $ne: reservation._id }
          },
          { status: 'waitlist' }
        );
        
        console.log(`🔄 House now FULL! Moved ${result.modifiedCount} pending reservations to waitlist`);
      }
      
      await house.save();
    }
    
    // If changing from approved to something else (reject, waitlist)
    if (oldStatus === 'approved' && status !== 'approved') {
      house.currentOccupants = Math.max(0, (house.currentOccupants || 0) - 1);
      
      console.log(`⬇️ Un-approved reservation. currentOccupants: ${house.currentOccupants}/${house.maxOccupants}`);
      
      // If was full, now has space available
      if (!house.isAvailable && house.currentOccupants < house.maxOccupants) {
        house.isAvailable = true;
        console.log(`✅ House now has space available again!`);
      }
      
      await house.save();
    }
    
    reservation.status = status;
    await reservation.save();
    
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete reservation
router.delete('/:reservationId', verifyToken, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.reservationId);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    // Only student can delete their own reservation
    if (reservation.studentId !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // If reservation was approved, decrease currentOccupants
    if (reservation.status === 'approved') {
      const house = await House.findById(reservation.houseId);
      if (house) {
        house.currentOccupants = Math.max(0, (house.currentOccupants || 0) - 1);
        
        // If was full, now has space available
        if (!house.isAvailable && house.currentOccupants < house.maxOccupants) {
          house.isAvailable = true;
          console.log(`✅ Student cancelled - House now has space available again!`);
        }
        
        await house.save();
      }
    }
    
    await reservation.deleteOne();
    console.log(`🗑️ Student cancelled reservation ${req.params.reservationId}`);
    res.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get approved houses for student
router.get('/student/:studentId/approved', verifyToken, async (req, res) => {
  try {
    const reservations = await Reservation.find({
      studentId: req.params.studentId,
      status: 'approved'
    });
    
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
