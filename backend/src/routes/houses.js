const express = require('express');
const router = express.Router();
const House = require('../models/House');
const { verifyToken } = require('../middleware/auth');

// Get all houses
router.get('/', verifyToken, async (req, res) => {
  try {
    const houses = await House.find().sort({ createdAt: -1 });
    res.json(houses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get house by ID
router.get('/:houseId', verifyToken, async (req, res) => {
  try {
    const house = await House.findById(req.params.houseId);
    
    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }
    
    res.json(house);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get houses by landlord
router.get('/landlord/:landlordId', verifyToken, async (req, res) => {
  try {
    const houses = await House.find({ landlordId: req.params.landlordId })
      .sort({ createdAt: -1 });
    res.json(houses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create house
router.post('/', verifyToken, async (req, res) => {
  try {
    const house = new House({
      ...req.body,
      landlordId: req.user.uid
    });
    
    await house.save();
    res.status(201).json(house);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update house
router.put('/:houseId', verifyToken, async (req, res) => {
  try {
    const house = await House.findById(req.params.houseId);
    
    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }
    
    // Only landlord can update their own house
    if (house.landlordId !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    Object.assign(house, req.body);
    await house.save();
    
    res.json(house);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete house
router.delete('/:houseId', verifyToken, async (req, res) => {
  try {
    const house = await House.findById(req.params.houseId);
    
    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }
    
    // Only landlord can delete their own house
    if (house.landlordId !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await house.deleteOne();
    res.json({ message: 'House deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add or update review for house
router.post('/:houseId/reviews', verifyToken, async (req, res) => {
  try {
    console.log('🔵 Add/Update review - req.body:', req.body);
    const { rating, comment } = req.body;
    console.log('🔵 Extracted rating:', rating, 'type:', typeof rating);
    console.log('🔵 Extracted comment:', comment);
    
    const house = await House.findById(req.params.houseId);
    
    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }
    
    // Check if user already has a review
    const existingReviewIndex = house.reviews.findIndex(r => r.userId === req.user.uid);
    
    if (existingReviewIndex !== -1) {
      // Update existing review
      const existingReview = house.reviews[existingReviewIndex];
      existingReview.rating = Number(rating);
      existingReview.comment = String(comment);
      existingReview.updatedAt = new Date();
      existingReview.isEdited = true;
      
      console.log('🔵 Updated existing review:', existingReview);
      
      // Recalculate average rating
      const totalRating = house.reviews.reduce((sum, r) => sum + r.rating, 0);
      house.averageRating = totalRating / house.reviews.length;
      
      await house.save();
      res.json(existingReview);
    } else {
      // Create new review
      const review = {
        id: `review_${Date.now()}`,
        userId: req.user.uid,
        rating: Number(rating),
        comment: String(comment),
        createdAt: new Date(),
        isEdited: false
      };
      
      console.log('🔵 New review object:', review);
      house.reviews.push(review);
      
      // Recalculate average rating
      const totalRating = house.reviews.reduce((sum, r) => sum + r.rating, 0);
      house.averageRating = totalRating / house.reviews.length;
      house.totalReviews = house.reviews.length;
      
      await house.save();
      res.json(review);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
