const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Create event (coordinator only)
router.post('/', authenticateToken, authorizeRoles('coordinator'), async (req, res) => {
  try {
    // Destructure all the fields from the detailed form
    const { clubId, ...eventData } = req.body;
    const createdById = req.user.id;

    const event = new Event({ 
      ...eventData,
      club: clubId, 
      createdBy: createdById
    });
    await event.save();

    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update event status (faculty)
router.patch('/:id/status', authenticateToken, authorizeRoles('coordinator'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ error: 'Invalid status value' });

    const event = await Event.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event status updated', event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Register student for event (student only)
router.post('/:id/register', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const { studentId } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { registeredStudents: studentId } },
      { new: true }
    );
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Student registered for event', event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get registered students + attendance
router.get('/:id/registrations', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('registeredStudents', 'name email role');
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const attendance = await Attendance.find({ event: req.params.id }).populate('student', 'name email role present odStatus');
    res.json({ registeredStudents: event.registeredStudents, attendance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   GET /api/events/:id
// @desc    Get a single event by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('club', 'name');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET /api/events/club/:clubId
// @desc    Get all events for a specific club
// @access  Private
router.get('/club/:clubId', authenticateToken, async (req, res) => {
  try {
    const events = await Event.find({ club: req.params.clubId }).sort({ date: -1 });
    res.json(events);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
