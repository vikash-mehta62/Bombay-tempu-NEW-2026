const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
