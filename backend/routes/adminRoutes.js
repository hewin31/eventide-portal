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

router.get(
  '/recent-activity',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const fetchLimit = 15; // Fetch a larger pool of items
      const displayLimit = 10; // Display up to 10 recent items

      // Fetch all recent items in parallel for better performance
      const [recentClubs, recentUsers, recentEvents] = await Promise.all([
        Club.find().sort({ createdAt: -1 }).limit(fetchLimit).lean(),
        User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 }).limit(fetchLimit).select('-password').lean(),
        Event.find().sort({ createdAt: -1 }).limit(fetchLimit).populate('club', 'name').lean()
      ]);

      const activities = [
        ...recentClubs.map(item => ({
          ...item,
          type: 'Club',
          title: `New club '${item.name || 'Unnamed Club'}' was created.`,
        })),
        ...recentUsers.map(item => ({
          ...item,
          type: 'User',
          title: `User '${item.name || 'Unnamed User'}' has registered.`,
        })),
        ...recentEvents.map(item => ({
          ...item,
          type: 'Event',
          // Safely access club name
          title: `Event '${item.name || 'Unnamed Event'}' was created in ${item.club?.name || 'a club'}.`,
        })),
      ];

      // More robust sorting and filtering
      const sortedActivities = activities
        .filter(item => item.createdAt) // Ensure createdAt exists
        .sort((a, b) => {
          // Defensive sorting to prevent crashes on invalid dates
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          if (isNaN(dateA) || isNaN(dateB)) {
            return 0; // Don't sort if dates are invalid
          }
          return dateB - dateA;
        })
        .slice(0, displayLimit); // Slice to the new display limit

      res.json(sortedActivities);
    } catch (err) {
      debug('Error fetching recent activity:', err);
      res.status(500).json({
        error: 'Server error while fetching recent activity.',
      });
    }
  }
);


router.patch('/users/:id/role', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!['faculty', 'member', 'student', 'coordinator'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error while updating user role.' });
  }
});

module.exports = router;
