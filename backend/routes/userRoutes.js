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
    }).select('name email').limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
