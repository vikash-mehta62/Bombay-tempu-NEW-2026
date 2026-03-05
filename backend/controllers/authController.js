const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createLog } = require('../middleware/activityLogger');

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public (or Owner only in production)
 */
exports.register = async (req, res) => {
  try {
    const { username, password, fullName, email, phone, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Create user
    const user = await User.create({
      username,
      password: password || '12345678', // Default password
      fullName,
      email: email || `${username}@temp.com`, // Default temp email
      phone,
      role: role || 'viewer',
      createdBy: req.user?._id // Track who created this user
    });

    // Generate token
    const token = generateToken(user._id);

    // Log activity
    await createLog(
      req.user?._id || user._id,
      req.user?.fullName || user.fullName,
      req.user?.role || user.role,
      `User registered: ${user.fullName} (${user.role})`,
      'CREATE',
      'users',
      { username: user.username, role: user.role, createdBy: req.user?.fullName }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
    // Log failed login attempt
      await createLog(
        null,
        username,
        'unknown',
        'Failed login attempt - user not found',
        'AUTH',
        'authentication',
        { username, reason: 'User not found' }
      ).catch(err => console.log('Log error:', err));

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      // Log failed login attempt
      await createLog(
        user._id,
        user.fullName,
        user.role,
        'Failed login attempt - wrong password',
        'AUTH',
        'authentication',
        { username, reason: 'Wrong password' }
      ).catch(err => console.log('Log error:', err));

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Log successful login
    await createLog(
      user._id,
      user.fullName,
      user.role,
      'User logged in successfully',
      'AUTH',
      'authentication',
      { username: user.username }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        lastLogin: user.lastLogin
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    // req.user is already populated by protect middleware
    // It can be from User, Driver, FleetOwner, or Client model
    const user = req.user;

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName,
        contact: user.contact || user.username,
        email: user.email,
        role: user.role,
        companyName: user.companyName || null,
        isActive: user.isActive
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
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res) => {
  try {
    // Log logout activity
    await createLog(
      req.user._id,
      req.user.fullName,
      req.user.role,
      'User logged out',
      'AUTH',
      'authentication',
      { username: req.user.username }
    );

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log password change
    await createLog(
      user._id,
      user.fullName,
      user.role,
      'Password changed',
      'UPDATE',
      'authentication',
      { username: user.username }
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all users
 * @route   GET /api/auth/users
 * @access  Private (Admin only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .populate('createdBy', 'fullName username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/auth/users/:id
 * @access  Private (Admin only)
 */
exports.updateUser = async (req, res) => {
  try {
    const { fullName, username, email, phone, password, role } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (username) user.username = username;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (password) user.password = password;

    await user.save();

    // Log activity
    await createLog(
      req.user._id,
      req.user.fullName,
      req.user.role,
      `Updated user: ${user.fullName}`,
      'UPDATE',
      'users',
      { userId: user._id, username: user.username }
    );

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/auth/users/:id
 * @access  Private (Admin only)
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    // Log activity
    await createLog(
      req.user._id,
      req.user.fullName,
      req.user.role,
      `Deleted user: ${user.fullName}`,
      'DELETE',
      'users',
      { userId: user._id, username: user.username }
    );

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Login for Driver/Fleet Owner/Client using phone number
 * @route   POST /api/auth/login-phone
 * @access  Public
 */
exports.loginWithPhone = async (req, res) => {
  try {
    const { phone, password, role } = req.body;

    // Validate input
    if (!phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone number, password, and role'
      });
    }

    let user;
    let Model;
    let modelName;

    // Determine which model to use based on role
    if (role === 'driver') {
      Model = require('../models/Driver');
      modelName = 'Driver';
    } else if (role === 'fleet_owner') {
      Model = require('../models/FleetOwner');
      modelName = 'FleetOwner';
    } else if (role === 'client') {
      Model = require('../models/Client');
      modelName = 'Client';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Use driver, fleet_owner, or client'
      });
    }

    // Find user by phone (contact field) and select password
    user = await Model.findOne({ contact: phone, isActive: true }).select('+password');

    if (!user) {
      // Log failed login attempt
      await createLog(
        null,
        phone,
        role,
        `Failed login attempt - ${modelName} not found`,
        'AUTH',
        'authentication',
        { phone, role, reason: `${modelName} not found` }
      ).catch(err => console.log('Log error:', err));

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password exists
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Password not set. Please contact administrator.'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      // Log failed login attempt
      await createLog(
        user._id,
        user.fullName,
        role,
        `Failed login attempt - wrong password`,
        'AUTH',
        'authentication',
        { phone, role, reason: 'Wrong password' }
      ).catch(err => console.log('Log error:', err));

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Log successful login
    await createLog(
      user._id,
      user.fullName,
      role,
      `${modelName} logged in successfully`,
      'AUTH',
      'authentication',
      { phone: user.contact, role }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        fullName: user.fullName,
        contact: user.contact,
        email: user.email,
        role: role,
        companyName: user.companyName || null
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
