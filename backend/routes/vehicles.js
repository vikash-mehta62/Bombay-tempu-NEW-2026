const express = require('express');
const router = express.Router();
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
  getVehicleStats,
  uploadDocument,
  deleteDocument
} = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');
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

// Get vehicle stats
router.get('/stats', getVehicleStats);

// CRUD routes with activity logging
router
  .route('/')
  .get(
    logActivity('Viewed vehicles list', 'READ', 'vehicles'),
    getAllVehicles
  )
  .post(
    authorize('admin', 'fleet_owner'),
    logActivity('Created new vehicle', 'CREATE', 'vehicles'),
    createVehicle
  );

router
  .route('/:id')
  .get(
    logActivity('Viewed vehicle details', 'READ', 'vehicles'),
    getVehicleById
  )
  .put(
    authorize('admin', 'fleet_owner'),
    logActivity('Updated vehicle', 'UPDATE', 'vehicles'),
    updateVehicle
  )
  .delete(
    authorize('admin'),
    logActivity('Deleted vehicle', 'DELETE', 'vehicles'),
    deleteVehicle
  );

// Update vehicle status
router.patch(
  '/:id/status',
  logActivity('Updated vehicle status', 'UPDATE', 'vehicles'),
  updateVehicleStatus
);

// Upload vehicle document
router.post('/:id/upload-document', upload.single('document'), uploadDocument);

// Delete vehicle document
router.delete('/:id/delete-document/:documentType', deleteDocument);

module.exports = router;
