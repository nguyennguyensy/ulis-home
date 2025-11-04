const User = require('../models/User');

/**
 * Get MongoDB _id from Firebase UID
 * @param {string} firebaseUid - Firebase UID
 * @returns {Promise<string|null>} MongoDB _id or null if not found
 */
async function getUserIdFromFirebaseUid(firebaseUid) {
  try {
    const user = await User.findOne({ firebaseUid }).select('_id');
    return user ? user._id.toString() : null;
  } catch (error) {
    console.error('Error getting user ID from Firebase UID:', error);
    return null;
  }
}

/**
 * Get user's MongoDB _id from request (assumes req.user.uid is Firebase UID from auth middleware)
 * @param {object} req - Express request object
 * @returns {Promise<string|null>} MongoDB _id or null if not found
 */
async function getUserIdFromRequest(req) {
  if (!req.user || !req.user.uid) {
    return null;
  }
  return await getUserIdFromFirebaseUid(req.user.uid);
}

module.exports = {
  getUserIdFromFirebaseUid,
  getUserIdFromRequest
};
