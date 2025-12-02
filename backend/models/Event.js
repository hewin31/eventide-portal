const mongoose = require('mongoose');

const ContactPersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  designation: { type: String },
  whatsappLink: { type: String, required: true },
});

const ReplySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  replies: [ReplySchema],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const EventSchema = new mongoose.Schema({
  event_id: { type: Number }, 
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
  tags: [{ type: String }], // Added tags field
  teamSize: { type: Number, default: 1 }, // Renamed from maxParticipants
  totalCapacity: { type: Number }, // Renamed from totalSeats
  remainingCapacity: { type: Number },
  eligibility: { type: String },
  registrationLink: { type: String },
  contactPersons: [ContactPersonSchema],
  posterImage: { type: mongoose.Schema.Types.ObjectId },
  galleryImages: [{ type: mongoose.Schema.Types.ObjectId }],
  registeredStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  requireODApproval: { type: Boolean, default: false }, // This was missing
  checkInId: { type: String, unique: true, sparse: true }, // For QR code check-in
  checkInQRCode: { type: String }, // Stores the QR code data URL
  viewsCount: {
    type: Number,
    default: 0,
  },
  likesCount: {
    type: Number,
    default: 0,
  },
  themeColor: { type: String, default: '#3b82f6' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  comments: [CommentSchema], // Added comments field
});

module.exports = mongoose.model('Event', EventSchema);
