const express = require('express');
const router = express.Router();
const clientPaymentController = require('../controllers/clientPaymentController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/', clientPaymentController.createPayment);
router.get('/trip/:tripId/client/:clientId', clientPaymentController.getPaymentsByTripAndClient);
router.delete('/:id', clientPaymentController.deletePayment);

module.exports = router;
