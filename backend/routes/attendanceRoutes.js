const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Mark attendance (faculty only)
router.post('/', authenticateToken, authorizeRoles('faculty'), async (req, res) => {
  try {
    const { eventId, studentId, present } = req.body;
    const attendance = new Attendance({ event: eventId, student: studentId, present: present || false });
    await attendance.save();
    res.status(201).json({ message: 'Attendance marked', attendance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Approve/reject OD (faculty only)
router.patch('/:id/od', authenticateToken, authorizeRoles('faculty'), async (req, res) => {
  try {
    const { odStatus } = req.body;
    if (!['approved', 'rejected'].includes(odStatus))
      return res.status(400).json({ error: 'Invalid odStatus value' });

    const attendance = await Attendance.findByIdAndUpdate(req.params.id, { odStatus }, { new: true });
    if (!attendance) return res.status(404).json({ error: 'Attendance record not found' });
    res.json({ message: 'OD status updated', attendance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
