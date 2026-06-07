const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', billController.getAllBills);
router.post('/', billController.saveBill);
router.get('/trip/:tripId', billController.getBillsByTrip);
router.get('/trip/:tripId/client/:clientId', billController.getBillByTripAndClient);
router.delete('/:id', billController.deleteBill);

module.exports = router;
