const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  description: {
    type: String,
    required: true,
    default: 'A description for this cool club.'
  },
  imageUrl: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'uploads.files'
  },
  coordinators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Club', ClubSchema);