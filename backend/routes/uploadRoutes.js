const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventide';

// Create storage engine
const storage = new GridFsStorage({
  db: new Promise((resolve, reject) => {
    mongoose.connection.on('connected', () => resolve(mongoose.connection.db));
    mongoose.connection.on('error', reject);
  }),
  // url: mongoURI, // Using db connection object is preferred
  file: (req, file) => {
    return {
      filename: `${Date.now()}-${file.originalname}`,
      bucketName: 'uploads' // Collection name
    };
  }
});

const upload = multer({ storage });

// @route   POST /api/upload/image
// @desc    Upload a single image
// @access  Private
router.post('/upload/image', [authenticateToken, upload.single('file')], (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  res.json({
    fileId: req.file.id,
    filePath: `/api/images/${req.file.id}`
  });
});

// @route   GET /api/images/:id
// @desc    Display a single image
// @access  Public
router.get('/images/:id', async (req, res) => {
  try {
    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on('error', () => {
      res.status(404).json({ error: 'Image not found' });
    });

    downloadStream.pipe(res);
  } catch (err) {
    res.status(400).json({ error: 'Invalid image ID' });
  }
});

module.exports = router;