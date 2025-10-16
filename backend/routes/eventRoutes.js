const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Create event (member only)
router.post('/', authenticateToken, authorizeRoles('member'), async (req, res) => {
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

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private (Member only)
router.put('/:id', authenticateToken, authorizeRoles('member'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(updatedEvent);
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
    const studentId = req.user.id; // Use authenticated user's ID for security
    const eventId = req.params.id;

    const event = await Event.findByIdAndUpdate(
      eventId,
      { $addToSet: { registeredStudents: studentId } }, // $addToSet prevents duplicates
      { new: true }
    );
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Also, create an attendance record for the student for this event
    const existingAttendance = await Attendance.findOne({ event: eventId, student: studentId });
    if (!existingAttendance) {
      const newAttendance = new Attendance({
        event: eventId, 
        student: studentId,
        // Check the event flag to set OD status
        odStatus: event.requireODApproval ? 'pending' : 'not_applicable'
      });
      await newAttendance.save();
    }

    res.json({ message: 'Student registered for event', event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get registered students + attendance
router.get('/:id/registrations', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('registeredStudents', 'name email role');
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    // Fetch all attendance records for the event and populate the student details
    const attendance = await Attendance.find({ event: req.params.id }).populate('student', 'name email');

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
    const events = await Event.find({ club: req.params.clubId }).sort({ startDateTime: -1 });
    res.json(events);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   GET /api/events
// @desc    Get all approved events from all clubs
// @access  Private (students only)
router.get('/', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const events = await Event.find({ status: 'approved' })
      .populate('club', 'name')
      .sort({ startDateTime: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
