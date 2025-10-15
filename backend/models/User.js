const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['faculty', 'member', 'student'], required: true },
  clubs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }]
});

module.exports = mongoose.model('User', UserSchema);