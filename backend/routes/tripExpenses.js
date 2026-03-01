const express = require('express');
const router = express.Router();
const tripExpenseController = require('../controllers/tripExpenseController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/', tripExpenseController.createExpense);
router.get('/trip/:tripId', tripExpenseController.getExpensesByTrip);
router.delete('/:id', tripExpenseController.deleteExpense);

module.exports = router;
