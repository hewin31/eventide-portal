const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Club = require('../models/Club');
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

router.get('/recent-activity', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const limit = 5;

    const recentClubs = await Club.find().sort({ createdAt: -1 }).limit(limit).lean();
    const recentUsers = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 }).limit(limit).lean();
    const recentEvents = await Event.find().sort({ createdAt: -1 }).limit(limit).lean();

    const activities = [
      ...recentClubs.map(item => ({ ...item, type: 'Club', title: item.name })),
      ...recentUsers.map(item => ({ ...item, type: 'User', title: item.name })),
      ...recentEvents.map(item => ({ ...item, type: 'Event', title: item.name })),
    ];

    // Sort all combined activities by date and take the most recent ones
    const sortedActivities = activities
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 7); // Get the top 7 recent activities overall

    res.json(sortedActivities);

  } catch (err) {
    debug(`Error fetching recent activity for admin: ${err.stack}`);
    res.status(500).json({ error: 'Server error while fetching recent activity.' });
  }
});


module.exports = router;
