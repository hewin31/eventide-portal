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
    const attendanceRecord = await Attendance.findById(req.params.id);
    if (!attendanceRecord) return res.status(404).json({ error: 'Attendance record not found' });
    attendanceRecord.present = !attendanceRecord.present;
    await attendanceRecord.save();
    res.json(attendanceRecord);
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

module.exports = router;