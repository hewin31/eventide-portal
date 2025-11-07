const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const Club = require('../models/Club');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const puppeteer = require('puppeteer');

const debug = require('debug')('app:attendanceRoutes');


// @route   POST /api/attendance/check-in
// @desc    Mark attendance by scanning a QR code
// @access  Private (Student)
router.post('/check-in', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const { checkInId } = req.body;
    const studentId = req.user.id;

    if (!checkInId) {
      return res.status(400).json({ error: 'Check-in ID is required.' });
    }

    // 1. Find the event using the unique checkInId from the QR code
    const event = await Event.findOne({ checkInId });
    if (!event) {
      return res.status(404).json({ error: 'Invalid or expired check-in QR code.' });
    }

    // Additional check: Ensure the event is currently approved and active
    if (event.status !== 'approved') {
      return res.status(403).json({ error: 'This event is not currently active for check-in.' });
    }

    // 2. Find the student's attendance record for this specific event
    const attendanceRecord = await Attendance.findOne({ event: event._id, student: studentId });

    if (!attendanceRecord) {
      // This case handles if a student who didn't register tries to check in.
      return res.status(403).json({ error: 'You are not registered for this event.' });
    }

    if (attendanceRecord.present) {
      return res.status(409).json({ message: `You are already marked as present for ${event.name}.` });
    }

    // 3. Mark as present and save
    attendanceRecord.present = true;
    attendanceRecord.updatedAt = new Date(); // Explicitly set the check-in time
    await attendanceRecord.save();

    res.json({ message: `Successfully checked in for ${event.name}!` });

  } catch (err) {
    console.error('Check-in error:', err.message);
    res.status(500).json({ error: 'Server error during check-in process.' });
  }
});


// @route   PATCH /api/attendance/:id/toggle
// @desc    Toggle a student's attendance status (present/absent)
// @access  Private (Member or Coordinator)
router.patch('/:id/toggle', authenticateToken, authorizeRoles('member', 'coordinator'), async (req, res) => {
  try {
    let attendanceRecord = await Attendance.findById(req.params.id);
    if (!attendanceRecord) return res.status(404).json({ error: 'Attendance record not found' });

    // Toggle the present status and explicitly update the timestamp
    const updatedRecord = await Attendance.findByIdAndUpdate(
      req.params.id,
      { present: !attendanceRecord.present, updatedAt: new Date() },
      { new: true }
    );
    res.json(updatedRecord);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   PATCH /api/attendance/:id/od
// @desc    Approve or reject an OD request
// @access  Private (Coordinator only)
router.patch('/:id/od', authenticateToken, authorizeRoles('coordinator'), async (req, res) => {
  try {
    const { odStatus } = req.body;
    if (!['approved', 'rejected'].includes(odStatus)) {
      return res.status(400).json({ error: 'Invalid odStatus value' });
    }

    const attendance = await Attendance.findByIdAndUpdate(req.params.id, { odStatus }, { new: true });
    if (!attendance) return res.status(404).json({ error: 'Attendance record not found' });
    res.json({ message: 'OD status updated', attendance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   GET /api/attendance/od-requests
// @desc    Get all pending OD requests for events managed by the coordinator
// @access  Private (Coordinator only)
router.get('/od-requests', authenticateToken, authorizeRoles('coordinator'), async (req, res) => {
  try {
    const coordinatorId = req.user.id;

    // 1. Find clubs managed by the coordinator
    const clubs = await Club.find({ coordinator: coordinatorId }).select('_id');
    const clubIds = clubs.map(c => c._id);

    if (clubIds.length === 0) {
      return res.json([]);
    }

    // 2. Find events belonging to those clubs
    const events = await Event.find({ club: { $in: clubIds } }).select('_id');
    const eventIds = events.map(e => e._id);

    if (eventIds.length === 0) {
      return res.json([]);
    }

    const odRequests = await Attendance.find({
      event: { $in: eventIds },
      odStatus: 'pending'
    })
    .populate('student', 'name email')
    .populate({ path: 'event', select: 'name startDateTime club', populate: { path: 'club', select: 'name' } })
    .sort({ createdAt: -1 });    
    
    res.json(odRequests);
  } catch (err) {
    console.error("Error fetching OD requests:", err); // Added logging
    res.status(500).json({ error: 'Server error while fetching OD requests.' });
  }
});

// @route   GET /api/attendance/my-od-requests
// @desc    Get all OD requests for the current student
// @access  Private (Student only)
router.get('/my-od-requests', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const studentId = req.user.id;

    const odRequests = await Attendance.find({ student: studentId })
      .populate({
        path: 'event',
        select: 'name startDateTime' // Select only the fields needed by the frontend
      })
      .sort({ createdAt: -1 }); // Show the most recent requests first

    res.json(odRequests);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Helper function to generate the HTML for a certificate with un-escaped tags
function generateCertificateHtml(studentName, eventName, eventDate) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <title>Certificate</title>
      <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=Great+Vibes&display=swap');

          @page {
              size: A4 landscape;
              margin: 0;
          }

          body {
              font-family: 'Cinzel', serif;
              margin: 0;
              width: 297mm;
              height: 210mm;
              background: #f7f5ef;
              display: flex;
              justify-content: center;
              align-items: center;
          }

          .certificate-container {
              width: 270mm;
              height: 185mm;
              background: white;
              border: 8px solid #d4af37;
              position: relative;
              padding: 18mm 15mm;
              box-sizing: border-box;
          }

          .inner-border {
              border: 3px solid #d4af37;
              position: absolute;
              top: 12mm;
              bottom: 12mm;
              left: 12mm;
              right: 12mm;
              pointer-events: none;
          }

          .watermark {
              position: absolute;
              font-size: 75px;
              font-weight: bold;
              color: rgba(0,0,0,0.03);
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-12deg);
              letter-spacing: 8px;
          }

          .header {
              font-size: 2.8em;
              color: #b8860b;
              text-align: center;
              margin-top: 0;
              margin-bottom: 8px;
              letter-spacing: 1px;
          }

          .sub-header {
              font-size: 1.1em;
              text-align: center;
              color: #444;
              letter-spacing: 2px;
              margin-bottom: 25px;
          }

          .content {
              text-align: center;
              color: #444;
              margin-top: 0;
          }

          .name-text {
              font-family: 'Great Vibes', cursive;
              font-size: 4.2em;
              margin: 10px 0 15px;
              color: #000;
          }

          .event-text {
              font-size: 1.6em;
              font-weight: bold;
              color: #1a3b4c;
              margin-top: 10px;
          }

          .date-text {
              margin-top: 10px;
              font-size: 1.1em;
              color: #555;
          }

          .footer {
              width: 80%;
              position: absolute;
              bottom: 25mm;
              left: 50%;
              transform: translateX(-50%);
              display: flex;
              justify-content: space-between;
          }

          .signature-block {
              width: 180px;
              text-align: center;
              font-size: 0.95em;
          }

          .signature-line {
              border-top: 2px solid #000;
              margin: 0 auto 5px;
              width: 150px;
          }

      </style>
  </head>

  <body>
      <div class="certificate-container">
          <div class="inner-border"></div>

          <div class="watermark">CERTIFICATE</div>

          <div class="header">CERTIFICATE OF PARTICIPATION</div>
          <div class="sub-header">This is proudly presented to</div>

          <div class="content">
              <div class="name-text">${studentName}</div>
              for attending the event
              <div class="event-text">"${eventName}"</div>
              <div class="date-text">Conducted on ${eventDate}</div>
          </div>

          <div class="footer">
              <div class="signature-block">
                  <div class="signature-line"></div>
                  COORDINATOR
              </div>

              <div class="signature-block">
                  <div class="signature-line"></div>
                  HEAD OF DEPARTMENT
              </div>
          </div>

      </div>
  </body>
  </html>`;
}

 
router.get('/:attendanceId/od-certificate', authenticateToken, authorizeRoles('student'), async (req, res) => {
  let browser;
  try {
    const { attendanceId } = req.params;
    const studentId = req.user.id;

    const attendance = await Attendance.findById(attendanceId)
      .populate('student', 'name')
      .populate('event', 'name startDateTime');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }

    if (attendance.student._id.toString() !== studentId) {
      return res.status(403).json({ message: 'You are not authorized to download this certificate.' });
    }

    if (attendance.odStatus !== 'approved') {
      return res.status(403).json({ message: 'Your OD request for this event has not been approved.' });
    }

    const studentName = attendance.student.name;
    const eventName = attendance.event.name;
    const eventDate = new Date(attendance.event.startDateTime).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const htmlContent = generateCertificateHtml(studentName, eventName, eventDate);

    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4', landscape: true, printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });

    const filename = `OD_Certificate_${eventName.replace(/\s/g, '_')}.pdf`;
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    debug('Failed to generate OD certificate:', error);
    if (!res.headersSent) res.status(500).json({ message: 'An error occurred while generating the certificate.' });
  } finally {
    if (browser) await browser.close();
  }
});

module.exports = router;