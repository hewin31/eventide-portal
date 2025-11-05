const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true,
  },
  expiryDate: {
    type: Date,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

const Announcement = mongoose.model('Announcement', AnnouncementSchema);

module.exports = Announcement;
