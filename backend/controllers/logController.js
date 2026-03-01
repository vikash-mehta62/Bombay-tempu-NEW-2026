const ActivityLog = require('../models/ActivityLog');
const ExcelJS = require('exceljs');

/**
 * @desc    Get all activity logs with filters
 * @route   GET /api/logs
 * @access  Private (owner, manager)
 */
exports.getAllLogs = async (req, res) => {
  try {
    const {
      userId,
      module,
      actionType,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    // Build query
    let query = {};

    if (userId) {
      query.userId = userId;
    }

    if (module) {
      query.module = module;
    }

    if (actionType) {
      query.actionType = actionType;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // Pagination
    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('userId', 'username fullName role');

    const total = await ActivityLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get logs by user
 * @route   GET /api/logs/user/:userId
 * @access  Private (owner, manager)
 */
exports.getLogsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100 } = req.query;

    const logs = await ActivityLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get logs by module
 * @route   GET /api/logs/module/:module
 * @access  Private (owner, manager)
 */
exports.getLogsByModule = async (req, res) => {
  try {
    const { module } = req.params;
    const { limit = 100 } = req.query;

    const logs = await ActivityLog.find({ module })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'username fullName role');

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get recent activity logs
 * @route   GET /api/logs/recent
 * @access  Private
 */
exports.getRecentLogs = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'username fullName role');

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get activity statistics
 * @route   GET /api/logs/stats
 * @access  Private (owner, manager)
 */
exports.getLogStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchQuery = {};
    if (startDate || endDate) {
      matchQuery.timestamp = {};
      if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
      if (endDate) matchQuery.timestamp.$lte = new Date(endDate);
    }

    // Activity by action type
    const byActionType = await ActivityLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$actionType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Activity by module
    const byModule = await ActivityLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$module',
          count: { $sum: 1 }
        }
      }
    ]);

    // Activity by user
    const byUser = await ActivityLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          userRole: { $first: '$userRole' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Total logs
    const total = await ActivityLog.countDocuments(matchQuery);

    res.status(200).json({
      success: true,
      data: {
        total,
        byActionType,
        byModule,
        topUsers: byUser
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Export logs to Excel
 * @route   GET /api/logs/export
 * @access  Private (owner, manager)
 */
exports.exportLogs = async (req, res) => {
  try {
    const { startDate, endDate, module, actionType } = req.query;

    // Build query
    let query = {};
    if (module) query.module = module;
    if (actionType) query.actionType = actionType;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .populate('userId', 'username fullName role')
      .lean();

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Activity Logs');

    // Add headers
    worksheet.columns = [
      { header: 'Date & Time', key: 'timestamp', width: 20 },
      { header: 'User Name', key: 'userName', width: 20 },
      { header: 'User Role', key: 'userRole', width: 15 },
      { header: 'Action', key: 'action', width: 40 },
      { header: 'Action Type', key: 'actionType', width: 15 },
      { header: 'Module', key: 'module', width: 15 },
      { header: 'IP Address', key: 'ipAddress', width: 15 }
    ];

    // Add rows
    logs.forEach(log => {
      worksheet.addRow({
        timestamp: new Date(log.timestamp).toLocaleString('en-IN'),
        userName: log.userName,
        userRole: log.userRole,
        action: log.action,
        actionType: log.actionType,
        module: log.module,
        ipAddress: log.ipAddress || 'N/A'
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=activity-logs-${Date.now()}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete old logs (cleanup)
 * @route   DELETE /api/logs/cleanup
 * @access  Private (owner only)
 */
exports.cleanupOldLogs = async (req, res) => {
  try {
    const { days = 90 } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} old log entries`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
