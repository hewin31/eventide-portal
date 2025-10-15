const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Create event (member only)
router.post('/', authenticateToken, authorizeRoles('member'), async (req, res) => {
  try {
    const { name, clubId, createdById } = req.body;
    const event = new Event({ name, club: clubId, createdBy: createdById });
    await event.save();
    res.status(201).json({ message: 'Event created', event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update event status (faculty)
router.patch('/:id/status', authenticateToken, authorizeRoles('faculty'), async (req, res) => {
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

module.exports = router;
