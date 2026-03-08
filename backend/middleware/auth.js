const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');
const FleetOwner = require('../models/FleetOwner');
const Client = require('../models/Client');

/**
 * Protect routes - verify JWT token
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Try to find user in User model first (Admin/Sub-Admin)
      let user = await User.findById(decoded.id).select('-password');
      
      // If not found in User, try Driver
      if (!user) {
        user = await Driver.findById(decoded.id).select('-password');
        if (user) {
          user.role = 'driver'; // Add role for consistency
        }
      }
      
      // If not found in Driver, try FleetOwner
      if (!user) {
        user = await FleetOwner.findById(decoded.id).select('-password');
        if (user) {
          user.role = 'fleet_owner'; // Add role for consistency
        }
      }
      
      // If not found in FleetOwner, try Client
      if (!user) {
        user = await Client.findById(decoded.id).select('-password');
        if (user) {
          user.role = 'client'; // Add role for consistency
        }
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.isActive === false) {
        return res.status(401).json({
          success: false,
          message: 'User account is inactive'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

/**
 * Check user role
 * Note: sub_admin is treated as admin for authorization purposes
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // If route requires 'admin' and user is 'sub_admin', allow access
    const userRole = req.user.role;
    const allowedRoles = [...roles];
    
    // If 'admin' is in allowed roles and user is 'sub_admin', grant access
    if (allowedRoles.includes('admin') && userRole === 'sub_admin') {
      return next();
    }
    
    // Normal role check
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `User role '${userRole}' is not authorized to access this route`
      });
    }
    next();
  };
};
