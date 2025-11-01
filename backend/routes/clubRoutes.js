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
      coordinators: coordinatorId ? [coordinatorId] : [],
      members: coordinatorId ? [coordinatorId] : [], // Also add initial coordinator to members
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
    const clubs = await Club.find().populate('coordinators', 'name').sort({ createdAt: -1 });
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
      .populate('coordinators', 'name email') // Populate coordinators' names and emails
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
// @access  Private (Admin or Club Coordinator)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'coordinator'), async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ msg: 'Club not found' });
    }
    // Allow if user is an admin OR the coordinator of this specific club
    if (req.user.role !== 'admin' && !club.coordinators.some(c => c.toString() === req.user.id)) {
      return res.status(403).json({ msg: 'User not authorized to edit this club' });
    }

    const updatedClub = await Club.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(updatedClub);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/clubs/:id/coordinators
// @desc    Add a coordinator to a club
// @access  Private (Admin only)
router.post('/:id/coordinators', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { coordinatorId } = req.body;
    const clubId = req.params.id;

    const newCoordinator = await User.findOne({ _id: coordinatorId, role: 'coordinator' });
    if (!newCoordinator) {
      return res.status(404).json({ msg: 'Coordinator not found or user is not a coordinator.' });
    }

    const club = await Club.findByIdAndUpdate(
      clubId,
      { 
        $addToSet: { 
          coordinators: coordinatorId,
          members: coordinatorId // Also ensure they are a member
        } 
      },
      { new: true }
    ).populate('coordinators', 'name email');

    if (!club) return res.status(404).json({ msg: 'Club not found' });

    await User.findByIdAndUpdate(coordinatorId, { $addToSet: { clubs: clubId } });

    res.json(club);
  } catch (err) {
    res.status(500).send('Server Error: ' + err.message);
  }
});

// @route   DELETE /api/clubs/:id/coordinators/:coordinatorId
// @desc    Remove a coordinator from a club
// @access  Private (Admin only)
router.delete('/:id/coordinators/:coordinatorId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id: clubId, coordinatorId } = req.params;

    const club = await Club.findByIdAndUpdate(
      clubId,
      { $pull: { coordinators: coordinatorId } },
      { new: true }
    ).populate('coordinators', 'name email');

    if (!club) return res.status(404).json({ msg: 'Club not found' });

    // We don't remove the club from the user's club list, as they might still be a member.
    // This can be adjusted if business logic requires it.

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
