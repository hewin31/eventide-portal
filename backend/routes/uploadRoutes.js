const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config();


const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});
/**
 * POST /api/upload/image
 * Upload a single image to GridFS
 * Private route
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});
**/
router.post('/upload/image', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
    const uploadStream = bucket.openUploadStream(req.file.originalname, { contentType: req.file.mimetype });

    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', () => {
      res.json({ fileId: uploadStream.id, filePath: `/api/images/${uploadStream.id}` });
    });

    uploadStream.on('error', () => res.status(500).json({ error: 'Image upload failed.' }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});


/**
 * GET /api/images/:id
 * Retrieve a single image from GridFS
 * Public route
 */
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
    console.error(err);
    res.status(400).json({ error: 'Invalid image ID' });
  }
});

module.exports = router;
