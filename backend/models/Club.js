const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  description: {
    type: String,
    required: true,
    default: 'A description for this cool club.'
  },
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&h=400&fit=crop'
  },
  coordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Club', ClubSchema);