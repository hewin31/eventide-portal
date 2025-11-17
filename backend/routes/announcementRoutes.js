const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @route   GET /api/announcements/active
// @desc    Get the currently active announcement
// @access  Private
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    // Find the highest priority announcement that is currently active.
    const activeAnnouncement = await Announcement.findOne({
      publishDate: { $lte: now }, // Must be published
      $or: [
        { expiryDate: null }, // Or has no expiry date
        { expiryDate: { $gt: now } } // Or has not expired yet
      ],
    })
    // Sort by priority first (desc), then by creation date (desc)
    // Mongoose can sort by enum order if they are defined alphabetically, but we want Critical > Important > Normal.
    .sort({ priority: -1, publishDate: -1 });

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
    const now = new Date();
    let query = Announcement.find();

    // Admins can see all announcements (including scheduled), others see only published ones.
    if (req.user.role !== 'admin') {
      query = query.where('publishDate').lte(now);
    }
    const announcements = await query.populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/announcements
// @desc    Create a new announcement
// @access  Private (Admin)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { message, expiryDate, publishDate, priority } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    // If publishDate is not provided, it will default to Date.now() via the schema.
    // If expiryDate is an empty string or falsy, it should be stored as null.
    const newAnnouncement = new Announcement({
      message,
      expiryDate: expiryDate || null,
      createdBy: req.user.id,
      publishDate: publishDate || undefined, // Let schema default apply if not provided
      priority: priority || 'Normal',
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
  const { message, expiryDate, publishDate, priority } = req.body;

  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $set: {
          message,
          priority,
          expiryDate: expiryDate || null,
          publishDate: publishDate || announcement.publishDate // Keep original if not provided
        }
      },
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
