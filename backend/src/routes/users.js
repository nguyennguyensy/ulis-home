const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// Create or get user after Firebase auth
router.post('/', verifyToken, async (req, res) => {
  try {
    const { email, role } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (user) {
      return res.json(user);
    }
    
    // Create new user
    user = new User({
      firebaseUid: req.user.uid,
      email: email || req.user.email,
      role,
      emailVerified: req.user.emailVerified,
      isProfileComplete: false
    });
    
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:userId', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/:userId', verifyToken, async (req, res) => {
  try {
    console.log('📝 Update user request:', {
      userId: req.params.userId,
      requestUserId: req.user.uid,
      body: req.body
    });

    // Only allow users to update their own profile
    if (req.user.uid !== req.params.userId) {
      console.log('❌ Forbidden: user mismatch');
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.params.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      console.log('❌ User not found:', req.params.userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ User updated successfully:', user.firebaseUid);
    res.json(user);
  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user (for incomplete profiles that timed out)
router.delete('/:userId', verifyToken, async (req, res) => {
  try {
    // Only allow users to delete their own account
    if (req.user.uid !== req.params.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const user = await User.findOneAndDelete({ firebaseUid: req.params.userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('🗑️ User deleted:', req.params.userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users (for admin or chat user list)
router.get('/', verifyToken, async (req, res) => {
  try {
    const users = await User.find().select('-__v');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get similar roommates for a house
router.post('/similar-roommates', verifyToken, async (req, res) => {
  try {
    const { houseId, userId } = req.body;
    console.log('🔍 Similar roommates request:', { houseId, userId });

    // Get current user's roommate profile
    const currentUser = await User.findOne({ firebaseUid: userId });
    if (!currentUser || !currentUser.roommateProfile) {
      console.log('⚠️ No roommate profile found for user:', userId);
      return res.json([]);
    }
    console.log('✅ Current user roommate profile:', currentUser.roommateProfile);

    const { cleanliness, noiseLevel, sleepSchedule } = currentUser.roommateProfile;

    // Find all students with roommate profiles (excluding current user)
    const allStudents = await User.find({
      firebaseUid: { $ne: userId },
      role: 'student',
      'roommateProfile.cleanliness': { $exists: true }
    }).select('firebaseUid name avatar age roommateProfile roommatePreference');
    console.log('📋 Found students with roommate profiles:', allStudents.length);

    // Calculate similarity score for each student
    const scoredStudents = allStudents.map(student => {
      let score = 0;
      const profile = student.roommateProfile;

      // Cleanliness similarity (max 40 points)
      const cleanlinessDiff = Math.abs(cleanliness - profile.cleanliness);
      score += (5 - cleanlinessDiff) * 8;

      // Noise level similarity (max 40 points)
      const noiseDiff = Math.abs(noiseLevel - profile.noiseLevel);
      score += (5 - noiseDiff) * 8;

      // Sleep schedule similarity (max 20 points)
      if (sleepSchedule === profile.sleepSchedule) {
        score += 20;
      }

      return {
        ...student.toObject(),
        similarityScore: score
      };
    });

    // Sort by similarity score and return top 5
    const topMatches = scoredStudents
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 5);

    console.log('✅ Returning top matches:', topMatches.length, 'students');
    res.json(topMatches);
  } catch (error) {
    console.error('Get similar roommates error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get students who reserved a specific house (for landlord to view profiles)
router.get('/house/:houseId/students', verifyToken, async (req, res) => {
  try {
    const Reservation = require('../models/Reservation');
    const House = require('../models/House');
    
    // Verify the house belongs to the landlord
    const house = await House.findById(req.params.houseId);
    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }
    
    if (house.landlordId !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden: Not your house' });
    }
    
    // Get all reservations for this house
    const reservations = await Reservation.find({ houseId: req.params.houseId });
    
    // Get student details
    const studentIds = [...new Set(reservations.map(r => r.studentId))];
    const students = await User.find({ 
      firebaseUid: { $in: studentIds },
      role: 'student'
    });
    
    // Map reservations to students
    const studentsWithReservation = students.map(student => {
      const reservation = reservations.find(r => r.studentId === student.firebaseUid);
      return {
        ...student.toObject(),
        reservation: reservation ? {
          id: reservation._id,
          status: reservation.status,
          createdAt: reservation.createdAt,
          expiresAt: reservation.expiresAt
        } : null
      };
    });
    
    console.log('✅ Returning', studentsWithReservation.length, 'students for house', req.params.houseId);
    res.json(studentsWithReservation);
  } catch (error) {
    console.error('Get house students error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
