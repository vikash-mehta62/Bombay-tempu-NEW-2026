const express = require('express');
const router = express.Router();
const multer = require('multer');
const lrController = require('../controllers/lrController');
const { protect } = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'), false);
    }
  }
});

// All routes require authentication
router.use(protect);

router.post('/', lrController.createLR);
router.get('/', lrController.getAllLRs);

// Document upload routes
router.post('/upload-document', upload.single('document'), lrController.uploadLRDocument);
router.post('/delete-document', lrController.deleteLRDocument);

router.get('/:id', lrController.getLRById);
router.put('/:id', lrController.updateLR);
router.delete('/:id', lrController.deleteLR);

module.exports = router;
