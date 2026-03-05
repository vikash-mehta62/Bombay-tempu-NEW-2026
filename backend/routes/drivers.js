const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// All routes require authentication
router.use(protect);

// Get all drivers
router.get('/', driverController.getAllDrivers);

// Get driver statistics
router.get('/stats', authorize('admin'), driverController.getDriverStats);

// Get driver by ID
router.get('/:id', driverController.getDriverById);

// Create new driver
router.post('/', authorize('admin'), driverController.createDriver);

// Update driver
router.put('/:id', authorize('admin'), driverController.updateDriver);

// Upload driver documents
router.post('/:id/upload-document', upload.single('document'), driverController.uploadDocument);

// Delete driver document
router.delete('/:id/delete-document/:documentType', driverController.deleteDocument);

// Delete driver
router.delete('/:id', authorize('admin'), driverController.deleteDriver);

module.exports = router;
