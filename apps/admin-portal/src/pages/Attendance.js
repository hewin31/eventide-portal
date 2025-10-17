const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  present: { type: Boolean, default: false },
  timestamp: { type: Date },
  odStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'not_applicable'],
    default: 'not_applicable'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Attendance', AttendanceSchema);