const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get all expenses
router.get('/', expenseController.getAllExpenses);

// Get expense statistics
router.get('/stats', expenseController.getExpenseStats);

// Get expenses by vehicle
router.get('/vehicle/:vehicleId', expenseController.getExpensesByVehicle);

// Create expense
router.post('/', authorize('admin'), expenseController.createExpense);

// Delete expense
router.delete('/:id', authorize('admin'), expenseController.deleteExpense);

module.exports = router;
