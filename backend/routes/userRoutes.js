const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Club = require('../models/Club');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

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
router.get('/coordinators', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const coordinators = await User.find({ role: 'coordinator' }).select('-password').sort({ name: 1 });
    res.json(coordinators);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/users
// @desc    Create a new user (for admins)
// @access  Private (Admin)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Please provide name, email, password, and role.' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (err) {
    res.status(500).json({ error: 'Server error while creating user.' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update a user's details (for admins)
// @access  Private (Admin)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { name, email, role } = req.body;
  const userId = req.params.id;

  try {
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email is already in use.' });
      }
    }

    const updatedFields = { name, email, role };
    // Filter out undefined fields so they don't overwrite existing data
    Object.keys(updatedFields).forEach(key => updatedFields[key] === undefined && delete updatedFields[key]);

    user = await User.findByIdAndUpdate(userId, { $set: updatedFields }, { new: true }).select('-password');

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error while updating user.' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user (for admins)
// @access  Private (Admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Remove user from any clubs they coordinate or are members of
    await Club.updateMany({ $or: [{ coordinators: userId }, { members: userId }] }, { $pull: { coordinators: userId, members: userId } });

    await User.findByIdAndDelete(userId);

    res.json({ msg: 'User has been deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error while deleting user.' });
  }
});

module.exports = router;
