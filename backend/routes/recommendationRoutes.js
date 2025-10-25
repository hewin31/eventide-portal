const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const User = require('../models/User');
const Event = require('../models/Event');
const path = require('path');

/**
 * @route   GET /api/recommendations
 * @desc    Get personalized event recommendations for the current student
 * @access  Private (Student)
 */
router.get('/', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    // 1. Get current user's profile
    const user = await User.findById(req.user.id).select('interests department');
    if (!user || !user.interests || !user.department) {
      return res.status(400).json({
        message: 'User profile is incomplete. Please set your interests and department.',
      });
    }

    // 2. Execute the Python script
    const pythonScriptPath = path.join(__dirname, '..', 'recommendation_project', 'get_recommendations.py');
    const pythonProcess = spawn('python', [
      pythonScriptPath,
      user.interests,
      user.department,
    ]);

    let recommendedEventIds = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      recommendedEventIds += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error(`Python script error: ${errorOutput}`);
        return res.status(500).json({ message: 'Could not generate recommendations.', error: errorOutput });
      }
      const eventIds = JSON.parse(recommendedEventIds);
      const recommendedEvents = await Event.find({ event_id: { $in: eventIds }, status: 'approved' }).populate('club', 'name');
      res.json(recommendedEvents);
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
