const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

require('dotenv').config();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    // Sign a JWT and return it to auto-login the user
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, clubs: [] }, // New user has no clubs
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('clubs');
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        clubs: (user.clubs || []).map(c => ({...c.toObject(), id: c._id.toString()})) },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Profile route
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // req.user.id is set by authenticateToken middleware from the JWT payload
    const user = await User.findById(req.user.id).populate('clubs');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Return the same user object structure as the login route
    const userProfile = { id: user._id, name: user.name, email: user.email, role: user.role, clubs: (user.clubs || []).map(c => ({...c.toObject(), id: c._id.toString()})) };
    res.json({ user: userProfile });
  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
});

module.exports = router;
