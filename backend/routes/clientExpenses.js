const express = require('express');
const router = express.Router();
const clientExpenseController = require('../controllers/clientExpenseController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/', clientExpenseController.createExpense);
router.get('/trip/:tripId/client/:clientId', clientExpenseController.getExpensesByTripAndClient);
router.delete('/:id', clientExpenseController.deleteExpense);

module.exports = router;
