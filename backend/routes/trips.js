const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get all trips
router.get('/', tripController.getAllTrips);

// Get trip statistics
router.get('/stats', authorize('admin'), tripController.getTripStats);

// Get trips by driver ID
router.get('/driver/:driverId', tripController.getTripsByDriver);

// Get trip by ID
router.get('/:id', tripController.getTripById);

// Create new trip
router.post('/', authorize('admin'), tripController.createTrip);

// Update trip
router.put('/:id', authorize('admin'), tripController.updateTrip);

// Update trip status
router.patch('/:id/status', authorize('admin'), tripController.updateTripStatus);

// Update trip POD status
router.patch('/:id/pod-status', authorize('admin'), tripController.updateTripPodStatus);

// Update actual POD amount
router.patch('/:id/actual-pod', authorize('admin'), tripController.updateActualPodAmt);

// Delete trip
router.delete('/:id', authorize('admin'), tripController.deleteTrip);

module.exports = router;
