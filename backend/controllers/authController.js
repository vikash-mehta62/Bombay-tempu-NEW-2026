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
      password,
      fullName,
      email,
      phone,
      role: role || 'viewer'
    });

    // Generate token
    const token = generateToken(user._id);

    // Log activity
    await createLog(
      user._id,
      user.fullName,
      user.role,
      'User registered',
      'CREATE',
      'authentication',
      { username: user.username, role: user.role }
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
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
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
