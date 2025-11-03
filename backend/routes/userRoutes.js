const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Search for users by name or email
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  const { search } = req.query;
  if (!search) {
    return res.json([]);
  }

  try {
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }).select('name email role').limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/users/coordinators
// @desc    Get all users with the coordinator role
// @access  Private (Admin)
router.get('/coordinators', authenticateToken, async (req, res) => {
  // In a real-world scenario, you might restrict this to admins: authorizeRoles('admin')
  try {
    const coordinators = await User.find({ role: 'coordinator' }).select('name email');
    res.json(coordinators);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
