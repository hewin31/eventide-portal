const mongoose = require('mongoose');

const ContactPersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  designation: { type: String },
  whatsappLink: { type: String, required: true },
});

const EventSchema = new mongoose.Schema({
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  eventType: { type: String, enum: ['technical', 'non-technical', 'workshop', 'cultural', 'sports'], required: true },
  eventCategory: { type: String, enum: ['club', 'department', 'college'], required: true },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  registrationDeadline: { type: Date },
  venue: { type: String, required: true },
  mode: { type: String, enum: ['online', 'offline', 'hybrid'], required: true },
  requiresFee: { type: Boolean, default: false },
  feeAmount: { type: Number },
  qrCodeImage: { type: mongoose.Schema.Types.ObjectId },
  maxParticipants: { type: Number },
  totalSeats: { type: Number },
  eligibility: { type: String },
  registrationLink: { type: String },
  contactPersons: [ContactPersonSchema],
  posterImage: { type: mongoose.Schema.Types.ObjectId },
  galleryImages: [{ type: mongoose.Schema.Types.ObjectId }],
  registeredStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  requireODApproval: { type: Boolean, default: false }, // This was missing
  themeColor: { type: String, default: '#3b82f6' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Event', EventSchema);
