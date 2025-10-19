const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// This is a placeholder. You'd likely have more complex logic here.
router.post('/', async (req, res) => {
  try {
    const attendance = new Attendance(req.body);
    await attendance.save();
    res.status(201).json(attendance);
  } catch (err) {
    res.status(400).json({ error: err.message });
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