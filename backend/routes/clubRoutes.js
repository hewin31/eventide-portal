const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const User = require('../models/User');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Create club (coordinator only)
router.post('/', authenticateToken, authorizeRoles('coordinator'), async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;
    const coordinatorId = req.user.id;

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

// @route   GET /api/clubs/:id
// @desc    Get a single club by ID with populated members
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('coordinator', 'name email') // Populate coordinator's name and email
      .populate('members', 'name email role'); // Populate members' name, email, and role

    if (!club) {
      return res.status(404).json({ msg: 'Club not found' });
    }

    res.json(club);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Club not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/clubs/:id/members
// @desc    Add a member to a club
// @access  Private (Coordinator only)
router.post('/:id/members', authenticateToken, authorizeRoles('coordinator'), async (req, res) => {
  try {
    const { userId } = req.body;
    const clubId = req.params.id;

    // Add user to club's members list
    const club = await Club.findByIdAndUpdate(clubId, { $addToSet: { members: userId } }, { new: true });
    // Add club to user's clubs list
    await User.findByIdAndUpdate(userId, { $addToSet: { clubs: clubId } });

    if (!club) return res.status(404).json({ msg: 'Club not found' });

    res.json(club.members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/clubs/:id/members/:memberId
// @desc    Remove a member from a club
// @access  Private (Coordinator only)
router.delete('/:id/members/:memberId', authenticateToken, authorizeRoles('coordinator'), async (req, res) => {
  try {
    const { id: clubId, memberId } = req.params;

    // Use Promise.all to run both updates concurrently
    await Club.findByIdAndUpdate(clubId, { $pull: { members: memberId } });
    await User.findByIdAndUpdate(memberId, { $pull: { clubs: clubId } });

    res.json({ msg: 'Member removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
