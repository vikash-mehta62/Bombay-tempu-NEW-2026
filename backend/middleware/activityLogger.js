const ActivityLog = require('../models/ActivityLog');

/**
 * Middleware to log user activities
 * Usage: Add after auth middleware in routes
 */
const logActivity = (action, actionType, module) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to log after successful response
    res.json = function(data) {
      // Only log if response is successful (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Log activity asynchronously (don't wait)
        logActivityAsync(req, action, actionType, module, data).catch(err => {
          console.error('Activity logging error:', err);
        });
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Async function to save activity log
 */
const logActivityAsync = async (req, action, actionType, module, responseData) => {
  try {
    const logData = {
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: action,
      actionType: actionType,
      module: module,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      timestamp: new Date()
    };

    // Add entity details if available
    if (req.params.id) {
      logData.entityId = req.params.id;
    }

    // Add details based on action type
    if (actionType === 'CREATE' && responseData?.data) {
      logData.entityId = responseData.data._id;
      logData.details = extractImportantFields(responseData.data, module);
    }

    if (actionType === 'UPDATE' && req.body) {
      logData.changes = {
        before: req.originalData || null, // Set by controller if needed
        after: req.body
      };
    }

    if (actionType === 'DELETE' && req.params.id) {
      logData.details = req.deletedData || {}; // Set by controller if needed
    }

    // Save log
    await ActivityLog.create(logData);
  } catch (error) {
    console.error('Failed to save activity log:', error);
  }
};

/**
 * Extract important fields based on module
 */
const extractImportantFields = (data, module) => {
  const fieldMap = {
    vehicles: ['vehicleNumber', 'vehicleType', 'make', 'model'],
    drivers: ['driverName', 'phone', 'licenseNumber'],
    clients: ['clientName', 'phone', 'email'],
    trips: ['tripNumber', 'origin', 'destination', 'freightAmount'],
    expenses: ['expenseCategory', 'amount', 'expenseDate'],
    invoices: ['invoiceNumber', 'totalAmount', 'clientId'],
    payments: ['amount', 'paymentMode', 'paymentDate']
  };

  const fields = fieldMap[module] || [];
  const extracted = {};
  
  fields.forEach(field => {
    if (data[field] !== undefined) {
      extracted[field] = data[field];
    }
  });

  return extracted;
};

/**
 * Manual logging function for special cases
 */
const createLog = async (userId, userName, userRole, action, actionType, module, details = {}) => {
  try {
    await ActivityLog.create({
      userId,
      userName,
      userRole,
      action,
      actionType,
      module,
      details,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to create activity log:', error);
  }
};

module.exports = {
  logActivity,
  createLog
};
