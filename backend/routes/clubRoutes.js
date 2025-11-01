const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const User = require('../models/User');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Create club (admin only)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { name, description, imageUrl, coordinatorId } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Club name and description are required.' });
    }

    let coordinator;
    if (coordinatorId) {
      coordinator = await User.findOne({ _id: coordinatorId, role: 'coordinator' });
      if (!coordinator) {
        return res.status(404).json({ error: 'Coordinator not found or user is not a coordinator.' });
      }
    }

    const club = new Club({
      name,
      description,
      imageUrl,
      coordinator: coordinatorId,
      members: coordinatorId ? [coordinatorId] : [],
    });
    await club.save();

    if (coordinator) {
      await User.findByIdAndUpdate(coordinatorId, { $addToSet: { clubs: club._id } });
    }

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

// @route   PUT /api/clubs/:id
// @desc    Update club details
// @access  Private (Coordinator only)
router.put('/:id', authenticateToken, authorizeRoles('coordinator'), async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ msg: 'Club not found' });
    }

    // Ensure the user is the coordinator of this club
    if (club.coordinator.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'User not authorized' });
    }

    const updatedClub = await Club.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(updatedClub);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/clubs/:id/coordinator
// @desc    Update a club's coordinator
// @access  Private (Admin only)
router.put('/:id/coordinator', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { coordinatorId } = req.body;
    const clubId = req.params.id;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ msg: 'Club not found' });
    }

    const newCoordinator = await User.findOne({ _id: coordinatorId, role: 'coordinator' });
    if (!newCoordinator) {
      return res.status(404).json({ msg: 'Coordinator not found or user is not a coordinator.' });
    }

    const oldCoordinatorId = club.coordinator;

    // Update club
    club.coordinator = coordinatorId;
    club.members.addToSet(coordinatorId); // Ensure new coordinator is a member
    await club.save();

    // Update user club lists
    if (oldCoordinatorId && oldCoordinatorId.toString() !== coordinatorId) {
      await User.findByIdAndUpdate(oldCoordinatorId, { $pull: { clubs: clubId } });
    }
    await User.findByIdAndUpdate(coordinatorId, { $addToSet: { clubs: clubId } });

    res.json(club);
  } catch (err) {
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

    // If the user is a 'student', upgrade their role to 'member'
    const user = await User.findById(userId);
    if (user && user.role === 'student') {
      user.role = 'member';
      await user.save();
      console.log(`User ${userId} role updated to 'member'`);
    }

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
