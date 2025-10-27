const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const Club = require('../models/Club');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @route   POST /api/attendance/check-in
// @desc    Mark attendance by scanning a QR code
// @access  Private (Student)
router.post('/check-in', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const { checkInId } = req.body;
    const studentId = req.user.id;

    if (!checkInId) {
      return res.status(400).json({ error: 'Check-in ID is required.' });
    }

    // 1. Find the event using the unique checkInId from the QR code
    const event = await Event.findOne({ checkInId });
    if (!event) {
      return res.status(404).json({ error: 'Invalid or expired check-in QR code.' });
    }

    // Additional check: Ensure the event is currently approved and active
    if (event.status !== 'approved') {
      return res.status(403).json({ error: 'This event is not currently active for check-in.' });
    }

    // 2. Find the student's attendance record for this specific event
    const attendanceRecord = await Attendance.findOne({ event: event._id, student: studentId });

    if (!attendanceRecord) {
      // This case handles if a student who didn't register tries to check in.
      return res.status(403).json({ error: 'You are not registered for this event.' });
    }

    if (attendanceRecord.present) {
      return res.status(409).json({ message: `You are already marked as present for ${event.name}.` });
    }

    // 3. Mark as present and save
    attendanceRecord.present = true;
    attendanceRecord.updatedAt = new Date(); // Explicitly set the check-in time
    await attendanceRecord.save();

    res.json({ message: `Successfully checked in for ${event.name}!` });

  } catch (err) {
    console.error('Check-in error:', err.message);
    res.status(500).json({ error: 'Server error during check-in process.' });
  }
});


// @route   PATCH /api/attendance/:id/toggle
// @desc    Toggle a student's attendance status (present/absent)
// @access  Private (Member or Coordinator)
router.patch('/:id/toggle', authenticateToken, authorizeRoles('member', 'coordinator'), async (req, res) => {
  try {
    let attendanceRecord = await Attendance.findById(req.params.id);
    if (!attendanceRecord) return res.status(404).json({ error: 'Attendance record not found' });

    // Toggle the present status and explicitly update the timestamp
    const updatedRecord = await Attendance.findByIdAndUpdate(
      req.params.id,
      { present: !attendanceRecord.present, updatedAt: new Date() },
      { new: true }
    );
    res.json(updatedRecord);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   PATCH /api/attendance/:id/od
// @desc    Approve or reject an OD request
// @access  Private (Coordinator only)
router.patch('/:id/od', authenticateToken, authorizeRoles('coordinator'), async (req, res) => {
  try {
    const { odStatus } = req.body;
    if (!['approved', 'rejected'].includes(odStatus)) {
      return res.status(400).json({ error: 'Invalid odStatus value' });
    }

    const attendance = await Attendance.findByIdAndUpdate(req.params.id, { odStatus }, { new: true });
    if (!attendance) return res.status(404).json({ error: 'Attendance record not found' });
    res.json({ message: 'OD status updated', attendance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   GET /api/attendance/od-requests
// @desc    Get all pending OD requests for events managed by the coordinator
// @access  Private (Coordinator only)
router.get('/od-requests', authenticateToken, authorizeRoles('coordinator'), async (req, res) => {
  try {
    const coordinatorId = req.user.id;

    // 1. Find clubs managed by the coordinator
    const clubs = await Club.find({ coordinator: coordinatorId }).select('_id');
    const clubIds = clubs.map(c => c._id);

    if (clubIds.length === 0) {
      return res.json([]);
    }

    // 2. Find events belonging to those clubs
    const events = await Event.find({ club: { $in: clubIds } }).select('_id');
    const eventIds = events.map(e => e._id);

    if (eventIds.length === 0) {
      return res.json([]);
    }

    const odRequests = await Attendance.find({
      event: { $in: eventIds },
      odStatus: 'pending'
    })
    .populate('student', 'name email')
    .populate({ path: 'event', select: 'name startDateTime club', populate: { path: 'club', select: 'name' } })
    .sort({ createdAt: -1 });    
    
    res.json(odRequests);
  } catch (err) {
    console.error("Error fetching OD requests:", err); // Added logging
    res.status(500).json({ error: 'Server error while fetching OD requests.' });
  }
});

// @route   GET /api/attendance/my-od-requests
// @desc    Get all OD requests for the current student
// @access  Private (Student only)
router.get('/my-od-requests', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const studentId = req.user.id;

    const odRequests = await Attendance.find({ student: studentId })
      .populate({
        path: 'event',
        select: 'name startDateTime' // Select only the fields needed by the frontend
      })
      .sort({ createdAt: -1 }); // Show the most recent requests first

    res.json(odRequests);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;