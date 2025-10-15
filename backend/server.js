const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
//const { authenticateToken, authorizeRoles } = require('./middleware/auth'); // Assuming these functions are defined in a separate file

const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Event = require('./models/Event');
const Club = require('./models/Club');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('API is running');
});
// Example protected route
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1d' }
    );

    res.json({ message: 'Login successful', token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User registered', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/events', authenticateToken, authorizeRoles('member'), async (req, res) => {
  try {
    const { name, clubId, createdById } = req.body;
    const event = new Event({
      name,
      club: clubId,
      createdBy: createdById
    });
    await event.save();
    res.status(201).json({ message: 'Event created', event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/clubs', async (req, res) => {
  try {
    const { name, facultyCoordinatorId, memberIds } = req.body;
    const club = new Club({ 
      name,
      facultyCoordinator: facultyCoordinatorId,
      members: memberIds || []
    });
    await club.save();
    res.status(201).json({ message: 'Club created', club });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Route to create a new club (faculty only)
app.post('/api/clubs', authenticateToken, authorizeRoles('faculty'), async (req, res) => {
  try {
    const { name, facultyCoordinatorId, memberIds } = req.body;
    const club = new Club({
      name,
      facultyCoordinator: facultyCoordinatorId,
      members: memberIds || []
    });
    await club.save();
    res.status(201).json({ message: 'Club created', club });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Route to mark attendance for an event
app.post('/api/attendance', async (req, res) => {
  try {
    const { eventId, studentId, present } = req.body;
    const attendance = new Attendance({
      event: eventId,
      student: studentId,
      present: present || false
    });
    await attendance.save();
    res.status(201).json({ message: 'Attendance marked', attendance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Route to mark attendance for an event (faculty only)
app.post('/api/attendance', authenticateToken, authorizeRoles('faculty'), async (req, res) => {
  try {
    const { eventId, studentId, present } = req.body;
    const attendance = new Attendance({
      event: eventId,
      student: studentId,
      present: present || false
    });
    await attendance.save();
    res.status(201).json({ message: 'Attendance marked', attendance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/attendance/:id/od', async (req, res) => {
  try {
    const { odStatus } = req.body; // should be 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(odStatus)) { 
      return res.status(400).json({ error: 'Invalid odStatus value' });
    }
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { odStatus },
      { new: true }
    );
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    res.json({ message: 'OD status updated', attendance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Route to approve or reject OD for an attendance record (faculty only)
app.patch('/api/attendance/:id/od', authenticateToken, authorizeRoles('faculty'), async (req, res) => {
  try {
    const { odStatus } = req.body; // should be 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(odStatus)) {
      return res.status(400).json({ error: 'Invalid odStatus value' });
    }
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { odStatus },
      { new: true }
    );
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    res.json({ message: 'OD status updated', attendance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/events/:id/status', authenticateToken, authorizeRoles('faculty'), async (req, res) => {
  try {
    const { status } = req.body; // should be 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event status updated', event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Route to register a student for an event
app.post('/api/events/:id/register', async (req, res) => {
  try {
    const { studentId } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { registeredStudents: studentId } },
      { new: true }
    );
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Student registered for event', event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Route to register a student for an event (student only)
app.post('/api/events/:id/register', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const { studentId } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { registeredStudents: studentId } },
      { new: true }
    );
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Student registered for event', event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Route to get registered students and their attendance for an event
app.get('/api/events/:id/registrations', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('registeredStudents', 'name email role');
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    // Get attendance records for this event
    const attendance = await Attendance.find({ event: req.params.id })
      .populate('student', 'name email role present odStatus');
    res.json({
      registeredStudents: event.registeredStudents,
      attendance
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User registered', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Async function to connect to MongoDB and start server
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventide');
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

// Role-based authorization middleware
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET || 'secretkey', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

startServer();