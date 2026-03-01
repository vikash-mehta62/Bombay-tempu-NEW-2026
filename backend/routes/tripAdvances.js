const express = require('express');
const router = express.Router();
const tripAdvanceController = require('../controllers/tripAdvanceController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/', tripAdvanceController.createAdvance);
router.get('/trip/:tripId', tripAdvanceController.getAdvancesByTrip);
router.delete('/:id', tripAdvanceController.deleteAdvance);

module.exports = router;
