const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @route   GET /api/announcements/active
// @desc    Get the currently active announcement
// @access  Public (or Private, depending on your app's auth requirements)
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const activeAnnouncement = await Announcement.findOne({
      $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }],
    }).sort({ createdAt: -1 });

    res.json(activeAnnouncement);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/announcements
// @desc    Get all announcements for admin management
// @access  Private (Admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const announcements = await Announcement.find().populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/announcements
// @desc    Create a new announcement
// @access  Private (Admin)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { message, expiryDate } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const newAnnouncement = new Announcement({
      message,
      expiryDate: expiryDate || null,
      createdBy: req.user.id,
    });

    const announcement = await newAnnouncement.save();
    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ error: 'Server error while creating announcement.' });
  }
});

// @route   PUT /api/announcements/:id
// @desc    Update an announcement (e.g., to activate/deactivate it)
// @access  Private (Admin)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { message, expiryDate } = req.body;

  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      req.params.id,
      // Only allow updating message and expiryDate
      { $set: { message, expiryDate } },
      { new: true }
    );

    res.json(updatedAnnouncement);
  } catch (err) {
    res.status(500).json({ error: 'Server error while updating announcement.' });
  }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete an announcement
// @access  Private (Admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Announcement deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error while deleting announcement.' });
  }
});

module.exports = router;
