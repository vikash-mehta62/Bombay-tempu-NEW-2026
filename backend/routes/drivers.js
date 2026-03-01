const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/auth');

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

// Delete driver
router.delete('/:id', authorize('admin'), driverController.deleteDriver);

module.exports = router;
