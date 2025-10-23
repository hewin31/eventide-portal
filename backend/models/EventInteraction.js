const mongoose = require('mongoose');

const EventInteractionSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['view', 'like'],
    required: true,
  },
}, { timestamps: { createdAt: true, updatedAt: false } });

// Create a compound unique index. This is the key to ensuring a user can only
// have one 'view' and one 'like' per event. The database will reject any
// duplicates automatically.
EventInteractionSchema.index({ eventId: 1, userId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('EventInteraction', EventInteractionSchema);