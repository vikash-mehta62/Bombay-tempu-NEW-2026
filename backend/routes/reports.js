const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and require owner/manager/admin role
router.use(protect);
router.use(authorize('owner', 'manager', 'admin'));

// @route   GET /api/reports
// @desc    Get comprehensive reports
// @access  Private (owner, manager)
router.get('/', reportController.getReports);

// @route   GET /api/reports/profit-breakdown
// @desc    Get profit breakdown by vehicle type
// @access  Private (owner, manager)
router.get('/profit-breakdown', reportController.getProfitBreakdown);

// @route   GET /api/reports/maintenance
// @desc    Get maintenance costs
// @access  Private (owner, manager)
router.get('/maintenance', reportController.getMaintenanceCosts);

// @route   GET /api/reports/pods
// @desc    Get POD reports
// @access  Private (owner, manager, admin)
router.get('/pods', reportController.getPODReports);

module.exports = router;
