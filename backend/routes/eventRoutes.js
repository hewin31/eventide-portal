const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const Club = require('../models/Club');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const debug = require('debug')('app:eventRoutes');
// Create event (member and coordinator)
router.post('/', authenticateToken, authorizeRoles('member', 'coordinator'), async (req, res) => {
  try {
    // Destructure all the fields from the detailed form
    const { clubId, ...eventData } = req.body;
    const createdById = req.user.id;

    const event = new Event({ 
      ...eventData,
      club: clubId, 
      createdBy: createdById
    });
    await event.save();
    debug(`Event created: ${event.name} by user ${createdById}`);

    res.status(201).json(event);
  } catch (err) {
    debug(`Error creating event: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles('member', 'coordinator'), async (req, res) => {
  console.log('DELETE /api/events/:id called');
  console.log('Event ID:', req.params.id);
  console.log('User:', req.user);

  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    console.log('Event found:', event);

    const club = await Club.findById(event.club);
    if (!club) {
      return res.status(404).json({ error: 'Associated club not found' });
    }
    console.log('Associated club:', club);
 
    const isCoordinator = club && club.coordinator ? club.coordinator._id.toString() === req.user.id : false;
    // Check if the user is a member of the club
    const isClubMember = club.members && club.members.some(memberId => memberId.toString() === req.user.id);
 
    if (!isCoordinator && !isClubMember) {
      return res.status(403).json({ error: 'User not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(req.params.id);
    await Attendance.deleteMany({ event: req.params.id });

    console.log(`Event ${req.params.id} and its attendance records deleted by user ${req.user.id}`);
    res.json({ message: 'Event and associated attendance records removed' });
  } catch (err) {
    console.log(`Error deleting event ${req.params.id}:`, err);
    if (err.kind === 'ObjectId' || err.name === 'CastError') {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Server error while trying to delete event' });
  }
});

// Update event
router.put('/:id', authenticateToken, authorizeRoles('member', 'coordinator'), async (req, res) => {
  debug(`PUT /api/events/${req.params.id} called`);
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const club = await Club.findById(event.club);
    if (!club) {
      return res.status(404).json({ error: 'Associated club not found' });
    }

    // Authorization check: Only the event creator or the club coordinator can update.
    const isCoordinator = club && club.coordinator ? club.coordinator._id.toString() === req.user.id : false;
    // Check if the user is a member of the club
    const isClubMember = club.members && club.members.some(memberId => memberId.toString() === req.user.id);
 
    if (!isCoordinator && !isClubMember) {
      return res.status(403).json({ error: 'User not authorized to update this event' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true } // new: true returns the updated doc, runValidators ensures schema rules are checked
    );

    debug(`Event ${req.params.id} updated by user ${req.user.id}`);
    res.json(updatedEvent);

  } catch (err) {
    debug(`Error updating event ${req.params.id}: ${err.message}`);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: `Invalid data format: ${err.message}` });
    }
    res.status(500).json({ error: 'Server error while trying to update event' });
  }
});

// Update event status (faculty)
router.patch('/:id/status', authenticateToken, authorizeRoles('coordinator'), async (req, res) => {
  try {
    const validStatuses = ['approved', 'rejected', 'pending'];
    const { status } = req.body;
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: 'Invalid status value' });

    const event = await Event.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Register student for event (student only)
router.post('/:id/register', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const studentId = req.user.id; // Use authenticated user's ID for security
    const eventId = req.params.id;

    // Check if student is already registered
    const existingRegistration = await Event.findOne({ _id: eventId, registeredStudents: studentId });
    if (existingRegistration) {
      return res.status(409).json({ error: 'Student already registered for this event' });
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      { $addToSet: { registeredStudents: studentId } }, // $addToSet prevents duplicates
      { new: true }
    );
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Also, create an attendance record for the student for this event
    const existingAttendance = await Attendance.findOne({ event: eventId, student: studentId });
    if (!existingAttendance) {
      const newAttendance = new Attendance({
        event: eventId, 
        student: studentId,
        // Check the event flag to set OD status
        odStatus: event.requireODApproval ? 'pending' : 'not_applicable'
      });
      await newAttendance.save();
    }

    res.json({ message: 'Student registered for event successfully', event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get registered students + attendance
router.get('/:id/registrations', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('registeredStudents', 'name email role');
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    // Fetch all attendance records for the event and populate the student details
    const attendance = await Attendance.find({ event: req.params.id }).populate('student', 'name email');

    res.json({ registeredStudents: event.registeredStudents, attendance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// @route   GET /api/events/public
// @desc    Get all approved events for public/guest view
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const events = await Event.find({ status: 'approved' })
      .populate('club', 'name')
      .sort({ startDateTime: -1 });
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});
// @route   GET /api/events/my-events
// @desc    Get all events the current student is registered for
// @access  Private (Student only)
router.get('/my-events', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find all events where the student is registered
    const events = await Event.find({ registeredStudents: studentId })
      .populate('club', 'name') // Include club name
      .sort({ startDateTime: -1 }); // Show latest events first

    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET /api/events/public
// @desc    Get all approved events for public/guest view
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const events = await Event.find({ status: 'approved' })
      .populate('club', 'name')
      .sort({ startDateTime: -1 });
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET /api/events/my-events
// @desc    Get all events the current student is registered for
// @access  Private (Student only)
router.get('/my-events', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find all events where the student is registered
    const events = await Event.find({ registeredStudents: studentId })
      .populate('club', 'name') // Include club name
      .sort({ startDateTime: -1 }); // Show latest events first

    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET /api/events/:id
// @desc    Get a single event by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('club', 'name');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Server Error' });
  }
});


// @route   GET /api/events/club/:clubId
// @desc    Get all events for a specific club
// @access  Private
router.get('/club/:clubId', authenticateToken, async (req, res) => {
  try {
    const events = await Event.find({ club: req.params.clubId }).sort({ startDateTime: -1 });
    res.json(events);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   GET /api/events
// @desc    Get all approved events from all clubs
// @access  Private (students only)
router.get('/', authenticateToken, authorizeRoles('student','coordinator','member'), async (req, res) => {
  try {
    const events = await Event.find({ status: 'approved' })
      .populate('club', 'name')
      .sort({ startDateTime: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
