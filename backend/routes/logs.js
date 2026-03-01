const express = require('express');
const router = express.Router();
const {
  getAllLogs,
  getLogsByUser,
  getLogsByModule,
  getRecentLogs,
  getLogStats,
  exportLogs,
  cleanupOldLogs
} = require('../controllers/logController');
const { protect, authorize } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

// All routes require authentication
router.use(protect);

// Only admin and accountant can access logs
router.use(authorize('admin', 'accountant'));

// Get all logs with filters
router.get(
  '/',
  logActivity('Viewed activity logs', 'READ', 'other'),
  getAllLogs
);

// Get recent logs
router.get(
  '/recent',
  logActivity('Viewed recent activity logs', 'READ', 'other'),
  getRecentLogs
);

// Get log statistics
router.get(
  '/stats',
  logActivity('Viewed activity log statistics', 'READ', 'other'),
  getLogStats
);

// Export logs to Excel
router.get(
  '/export',
  logActivity('Exported activity logs', 'EXPORT', 'other'),
  exportLogs
);

// Get logs by user
router.get('/user/:userId', getLogsByUser);

// Get logs by module
router.get('/module/:module', getLogsByModule);

// Cleanup old logs (admin only)
router.delete(
  '/cleanup',
  authorize('admin'),
  logActivity('Cleaned up old activity logs', 'DELETE', 'other'),
  cleanupOldLogs
);

module.exports = router;
