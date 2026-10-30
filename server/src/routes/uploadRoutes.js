const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

// @route POST /api/v1/upload
router.post('/', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  // Construct relative url for client
  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
    success: true,
    file: {
      url: fileUrl,
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
  });
});

module.exports = router;

