const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const debug = require('debug')('app:adminRoutes');

// @route   GET /api/admin/events
// @desc    Get all events for admin dashboard
// @access  Private (Admin)
router.get('/events', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    debug(`Error fetching all events for admin: ${err.stack}`);
    res.status(500).json({ error: 'Server error while fetching all events.' });
  }
});

// @route   GET /api/admin/users/all
// @desc    Get all users for admin dashboard (non-paginated)
// @access  Private (Admin)
router.get('/users/all', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Server error while fetching all users.' });
    }
});

module.exports = router;
