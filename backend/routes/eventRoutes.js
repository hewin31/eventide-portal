const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const EventInteraction = require('../models/EventInteraction');
const Club = require('../models/Club');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { generateEventQRCode } = require('../services/qrService'); // Correctly imported

const debug = require('debug')('app:eventRoutes');

// -----------------------------
// Create event (member and coordinator)
// -----------------------------
router.post('/', authenticateToken, authorizeRoles('member', 'coordinator'), async (req, res) => {
  try {
    const { clubId, ...eventData } = req.body;
    const { id: createdById, role: creatorRole } = req.user;

    const finalStatus = creatorRole === 'coordinator' ? 'approved' : 'pending';

    const event = new Event({ 
      ...eventData, // isDraft property from body will be ignored by the schema
      club: clubId, 
      createdBy: createdById,
      status: finalStatus,
    });

    // Generate QR code if approved immediately
    if (event.status === 'approved') {
      try {
        const { checkInId, checkInQRCode } = await generateEventQRCode(event);
        event.checkInId = checkInId;
        event.checkInQRCode = checkInQRCode;
      } catch (qrError) {
        debug(`QR Code generation failed: ${qrError.message}`);
      }
    }

    await event.save();
    debug(`Event created: ${event.name} by user ${createdById}`);
    res.status(201).json(event);

  } catch (err) {
    debug(`Error creating event: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

// -----------------------------
// Delete event
// -----------------------------
router.delete('/:id', authenticateToken, authorizeRoles('member', 'coordinator'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const club = await Club.findById(event.club);
    if (!club) return res.status(404).json({ error: 'Associated club not found' });

    const isCoordinator = club.coordinator?._id?.toString() === req.user.id;
    const isClubMember = club.members?.some(memberId => memberId.toString() === req.user.id);

    if (!isCoordinator && !isClubMember)
      return res.status(403).json({ error: 'User not authorized to delete this event' });

    await Event.findByIdAndDelete(req.params.id);
    await Attendance.deleteMany({ event: req.params.id });

    res.json({ message: 'Event and associated attendance records removed' });

  } catch (err) {
    console.log(`Error deleting event: ${err}`);
    if (err.kind === 'ObjectId') return res.status(404).json({ error: 'Event not found' });
    res.status(500).json({ error: 'Server error while deleting event' });
  }
});

// -----------------------------
// Update event details
// -----------------------------
router.put('/:id', authenticateToken, authorizeRoles('member', 'coordinator'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const club = await Club.findById(event.club);
    if (!club) return res.status(404).json({ error: 'Associated club not found' });

    const isCoordinator = club.coordinator?._id?.toString() === req.user.id;
    const isClubMember = club.members?.some(memberId => memberId.toString() === req.user.id);
    if (!isCoordinator && !isClubMember)
      return res.status(403).json({ error: 'User not authorized to update this event' });

    Object.assign(event, req.body);
    const updatedEvent = await event.save();
    res.json(updatedEvent);

  } catch (err) {
    debug(`Error updating event: ${err.message}`);
    res.status(500).json({ error: 'Server error while trying to update event' });
  }
});

// -----------------------------
// Update event status (faculty only)
// -----------------------------
router.patch('/:id/status', authenticateToken, authorizeRoles('coordinator'), async (req, res) => {
  try {
    const validStatuses = ['approved', 'rejected', 'pending'];
    const { status } = req.body;
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: 'Invalid status value' });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    event.status = status;

    if (status === 'approved' && !event.checkInQRCode) {
      try {
        const { checkInId, checkInQRCode } = await generateEventQRCode(event);
        event.checkInId = checkInId;
        event.checkInQRCode = checkInQRCode;
        debug(`QR Code generated for event ${event._id} on approval.`);
      } catch (qrError) {
        debug(`QR Code generation failed for event ${event._id} on approval: ${qrError.message}`);
      }
    }
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -----------------------------
// Register student for event
// -----------------------------
router.post('/:id/register', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const studentId = req.user.id;
    const eventId = req.params.id;

    const existingRegistration = await Event.findOne({
      _id: eventId,
      registeredStudents: studentId,
    });
    if (existingRegistration)
      return res.status(409).json({ error: 'Already registered for this event' });

    const event = await Event.findByIdAndUpdate(
      eventId,
      { $addToSet: { registeredStudents: studentId } },
      { new: true }
    );
    if (!event) return res.status(404).json({ error: 'Event not found' });

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

    res.json({ message: 'Registered successfully', event });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -----------------------------
// Record a view for an event (student only)
// -----------------------------
router.post('/:id/view', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // Attempt to create a new interaction record.
    // The unique index on the EventInteraction model will prevent a user from
    // having more than one 'view' record for the same event.
    await EventInteraction.create({
      eventId,
      userId,
      type: 'view',
    });

    // If the interaction was created successfully (i.e., it's a new view),
    // increment the viewsCount on the Event.
    await Event.findByIdAndUpdate(eventId, { $inc: { viewsCount: 1 } });

    res.status(200).json({ message: 'View recorded successfully.' });
  } catch (err) {
    // A duplicate key error (code 11000 in MongoDB) means the user has already viewed this event.
    // This is expected behavior, not a server error.
    if (err.code === 11000) {
      return res.status(200).json({ message: 'Event already viewed by this user.' });
    }
    debug(`Error recording view: ${err.message}`);
    res.status(500).json({ error: 'Server error while recording view.' });
  }
});

// -----------------------------
// Like/Unlike an event (student only)
// -----------------------------
router.post('/:id/like', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const existingLike = await EventInteraction.findOne({
      eventId,
      userId,
      type: 'like',
    });

    if (existingLike) {
      // User has already liked the event, so this request is to "unlike" it.
      await EventInteraction.findByIdAndDelete(existingLike._id);
      await Event.findByIdAndUpdate(eventId, { $inc: { likesCount: -1 } });
      res.status(200).json({ message: 'Event unliked successfully.', liked: false });
    } else {
      // User has not liked the event yet, so this is a "like" request.
      // The unique index will prevent race conditions if the user clicks multiple times quickly.
      await EventInteraction.create({
        eventId,
        userId,
        type: 'like',
      });
      await Event.findByIdAndUpdate(eventId, { $inc: { likesCount: 1 } });
      res.status(200).json({ message: 'Event liked successfully.', liked: true });
    }
  } catch (err) {
    // A duplicate key error can happen in a race condition where the user clicks 'like'
    // very fast multiple times before the first request completes. We can treat it as success.
    if (err.code === 11000) {
      return res.status(200).json({ message: 'Event already liked by this user.', liked: true });
    }
    debug(`Error liking event: ${err.message}`);
    res.status(500).json({ error: 'Server error while liking event.' });
  }
});


// -----------------------------
// Get registered students + attendance
// -----------------------------
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

// -----------------------------
// Public routes (no auth)
// -----------------------------
router.get('/public/:id', async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, status: 'approved' })
      .populate('club', 'name');

    if (!event) {
      return res.status(404).json({ error: 'Event not found or not approved' });
    }

    res.json(event);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Server Error' });
  }
});

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

// -----------------------------
// Get student’s registered events
// -----------------------------
router.get('/my-events', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const studentId = req.user.id;

    const pipeline = [
      { $match: { registeredStudents: new mongoose.Types.ObjectId(studentId) } },
      { $sort: { startDateTime: -1 } },
      {
        $lookup: {
          from: 'clubs',
          localField: 'club',
          foreignField: '_id',
          as: 'clubDetails'
        }
      },
      { $unwind: { path: '$clubDetails', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'eventinteractions',
          let: { eventId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$eventId', '$$eventId'] },
                    { $eq: ['$userId', new mongoose.Types.ObjectId(studentId)] },
                    { $eq: ['$type', 'like'] }
                  ]
                }
              }
            }
          ],
          as: 'userLike'
        }
      },
      { $addFields: { userHasLiked: { $gt: [{ $size: '$userLike' }, 0] }, club: { name: '$clubDetails.name' } } },
      { $project: { userLike: 0, clubDetails: 0 } }
    ];

    const events = await Event.aggregate(pipeline);
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// -----------------------------
// Get single event (private)
// -----------------------------
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('club', 'name').lean(); // Use .lean() for a plain object

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // --- START: Added Logic ---
    // Check if the current user has liked this event
    const userId = req.user.id;
    if (userId) {
      const likeInteraction = await EventInteraction.findOne({
        eventId: event._id,
        userId: userId,
        type: 'like',
      });
      event.userHasLiked = !!likeInteraction; // Add a boolean `userHasLiked` field

      // Also check if the user is registered
      event.isRegistered = event.registeredStudents.some(studentId => studentId.toString() === userId);
    }
    // --- END: Added Logic ---


    res.json(event);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Server Error' });
  }
});

// -----------------------------
// Get all events for a specific club
// -----------------------------
router.get('/club/:clubId', authenticateToken, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { clubId } = req.params;
    const userId = req.user?.id;

    const pipeline = [
      { $match: { club: new mongoose.Types.ObjectId(clubId) } },
      { $sort: { startDateTime: -1 } },
      {
        $lookup: {
          from: 'clubs',
          localField: 'club',
          foreignField: '_id',
          as: 'clubDetails'
        }
      },
      { $unwind: { path: '$clubDetails', preserveNullAndEmptyArrays: true } },
    ];

    if (userId) {
      pipeline.push(
        {
          $lookup: {
            from: 'eventinteractions',
            let: { eventId: '$_id' },
            pipeline: [
              { $match: { $expr: { $and: [ { $eq: ['$eventId', '$$eventId'] }, { $eq: ['$userId', new mongoose.Types.ObjectId(userId)] }, { $eq: ['$type', 'like'] } ] } } }
            ],
            as: 'userLike'
          }
        },
        { $addFields: { userHasLiked: { $gt: [{ $size: '$userLike' }, 0] } } }
      );
    }

    pipeline.push(
      { $addFields: { club: { name: '$clubDetails.name' } } },
      { $project: { userLike: 0, clubDetails: 0 } }
    );

    const events = await Event.aggregate(pipeline);
    res.json(events);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -----------------------------
// Get all approved events (students, coordinators, members)
// -----------------------------
router.get('/', authenticateToken, authorizeRoles('student','coordinator','member'), async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = req.user?.id; // Use optional chaining for safety

    // Use an aggregation pipeline to efficiently add `userHasLiked` to each event
    const pipeline = [
      { $match: { status: 'approved' } },
      { $sort: { startDateTime: -1 } },
      {
        $lookup: { // Join with clubs collection
          from: 'clubs',
          localField: 'club',
          foreignField: '_id',
          as: 'clubDetails',
        },
      },
      { $unwind: { path: '$clubDetails', preserveNullAndEmptyArrays: true } }, // Deconstruct the clubDetails array
      { $addFields: { club: { _id: '$clubDetails._id', name: '$clubDetails.name' } } },
    ];

    // Only add the 'like' lookup if a user is logged in
    if (userId) {
      pipeline.push(
        {
          $lookup: { // Join with eventinteractions to check for likes
            from: 'eventinteractions',
            let: { eventId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$eventId', '$$eventId'] },
                      { $eq: ['$userId', new mongoose.Types.ObjectId(userId)] },
                      { $eq: ['$type', 'like'] },
                    ],
                  },
                },
              },
            ],
            as: 'userLike',
          },
        },
        { $addFields: { userHasLiked: { $gt: [{ $size: '$userLike' }, 0] } } }
      );
    }

    pipeline.push({ $project: { userLike: 0, clubDetails: 0 } }); // Clean up intermediate fields

    const events = await Event.aggregate(pipeline);

    res.json(events); // The list of events now includes `userHasLiked` for each one
  } catch (err) {
    debug(`Error fetching all events: ${err.stack}`); // Log the full stack for better debugging
    res.status(500).json({ error: 'Server error while fetching events.' });
  }
});

module.exports = router;
