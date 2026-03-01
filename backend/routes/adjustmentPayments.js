const express = require('express');
const router = express.Router();
const adjustmentPaymentController = require('../controllers/adjustmentPaymentController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Create adjustment payment
router.post('/', adjustmentPaymentController.createAdjustmentPayment);

// Get adjustment payments by trip and client
router.get('/trip/:tripId/client/:clientId', adjustmentPaymentController.getByTripAndClient);

// Get all adjustment payments for a client
router.get('/client/:clientId', adjustmentPaymentController.getByClient);

// Delete adjustment payment
router.delete('/:id', adjustmentPaymentController.deleteAdjustmentPayment);

module.exports = router;
