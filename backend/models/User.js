const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // This should be a password_hash
  role: { type: String, enum: ['faculty', 'member', 'student', 'coordinator'], required: true },
  clubs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }],
  department: { type: String },
  interests: { type: String } // Stored as a comma-separated string
});

module.exports = mongoose.model('User', UserSchema);