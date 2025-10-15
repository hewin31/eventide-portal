const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const User = require('../models/User');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Create club (faculty or coordinator)
router.post('/', authenticateToken, authorizeRoles('faculty', 'coordinator'), async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;
    const coordinatorId = req.user.userId;

    const club = new Club({
      name,
      description,
      imageUrl,
      coordinator: coordinatorId,
      members: [coordinatorId], // Coordinator is always a member
    });
    await club.save();

    // Add the club to the coordinator's user document
    await User.findByIdAndUpdate(coordinatorId, { $addToSet: { clubs: club._id } });

    res.status(201).json(club);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   GET /api/clubs
// @desc    Get all clubs
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const clubs = await Club.find().populate('coordinator', 'name').sort({ createdAt: -1 });
    res.json(clubs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
