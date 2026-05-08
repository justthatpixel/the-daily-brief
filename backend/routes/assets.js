const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const assetsDir = path.join(__dirname, '../../content/assets');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(assetsDir, { recursive: true });
      cb(null, assetsDir);
    } catch (e) {
      cb(e);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const id = uuidv4();
    cb(null, `${id}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: ' + allowed.join(', ')));
    }
  }
});

// POST /api/assets/upload
router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const url = `/assets/${req.file.filename}`;
  
  res.json({
    success: true,
    url,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

// GET /assets/:filename - Serve uploaded assets
router.get('/:filename', async (req, res) => {
  const filePath = path.join(assetsDir, req.params.filename);
  
  try {
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch {
    res.status(404).json({ error: 'File not found' });
  }
});

// DELETE /api/assets/:filename
router.delete('/:filename', async (req, res) => {
  const filePath = path.join(assetsDir, req.params.filename);
  
  try {
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;