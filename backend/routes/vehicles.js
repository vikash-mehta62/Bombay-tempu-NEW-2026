const express = require('express');
const router = express.Router();
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
  getVehicleStats
} = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

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

module.exports = router;
