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
  coordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Club', ClubSchema);