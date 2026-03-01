const ActivityLog = require('../models/ActivityLog');

/**
 * Create an activity log entry
 * @param {Object} params - Log parameters
 * @param {Object} params.user - User object from req.user
 * @param {String} params.action - Action description
 * @param {String} params.actionType - CREATE, READ, UPDATE, DELETE, etc.
 * @param {String} params.module - Module name
 * @param {String} params.entityId - ID of the entity being acted upon
 * @param {String} params.entityType - Type of entity
 * @param {Object} params.details - Additional details
 * @param {Object} params.changes - Before/after changes
 * @param {Object} params.req - Express request object (optional)
 */
const createActivityLog = async (params) => {
  try {
    const {
      user,
      action,
      actionType,
      module,
      entityId = null,
      entityType = null,
      details = {},
      changes = {},
      req = null
    } = params;

    const logData = {
      userId: user?._id || null,
      userName: user?.fullName || user?.username || 'System',
      userRole: user?.role || 'system',
      action,
      actionType,
      module,
      entityId,
      entityType,
      details,
      changes,
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null
    };

    await ActivityLog.create(logData);
  } catch (error) {
    console.error('Error creating activity log:', error);
    // Don't throw error - logging should not break the main flow
  }
};

module.exports = { createActivityLog };
