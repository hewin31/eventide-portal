const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true,
  },
  priority: {
    type: String,
    enum: ['Normal', 'Important', 'Critical'],
    default: 'Normal',
  },
  expiryDate: {
    type: Date,
    default: null,
  },
  publishDate: {
    type: Date,
    // Default to now, so existing/newly created announcements without a
    // specific publish date are visible immediately.
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

// Add a TTL index to automatically delete announcements after their expiry date.
// The `expireAfterSeconds: 0` option tells MongoDB to expire documents at the time specified in `expiryDate`.
// The `partialFilterExpression` ensures that this index only applies to documents where `expiryDate` is set.
// Announcements without an expiry date will not be automatically deleted.
AnnouncementSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expiryDate: { $exists: true } } });

const Announcement = mongoose.model('Announcement', AnnouncementSchema);

module.exports = Announcement;
