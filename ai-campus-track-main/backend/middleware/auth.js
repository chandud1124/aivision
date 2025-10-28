import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../config/logger.js';

// Protect routes - Verify JWT token
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (excluding password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      // Check if password was changed after token was issued
      if (req.user.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          success: false,
          message: 'User recently changed password. Please login again.'
        });
      }

      next();
    } catch (error) {
      logger.error('Auth middleware error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

// Permission-based authorization
export const checkPermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // SuperAdmin has all permissions
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Check if user has permission for this module and action
    const hasPermission = req.user.permissions.some(
      perm => perm.module === module && perm.actions.includes(action)
    );

    if (!hasPermission) {
      logger.warn(`User ${req.user.email} attempted unauthorized action: ${action} on ${module}`);
      return res.status(403).json({
        success: false,
        message: `You don't have permission to ${action} ${module}`
      });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Just continue without user
      logger.debug('Optional auth failed, continuing without user');
    }
  }

  next();
};

// Device API key authentication (for RFID readers/cameras)
export const authenticateDevice = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required'
    });
  }

  try {
    // Import device models
    const RFIDDevice = (await import('../models/RFIDDevice.js')).default;
    const Camera = (await import('../models/Camera.js')).default;

    // Check if it's an RFID device or camera
    let device = await RFIDDevice.findOne({ 'authentication.apiKey': apiKey }).select('+authentication.apiKey');
    
    if (!device) {
      // Check cameras
      device = await Camera.findOne({ 'authentication.apiKey': apiKey });
    }

    if (!device) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    if (!device.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Device is not active'
      });
    }

    req.device = device;
    next();
  } catch (error) {
    logger.error('Device auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error authenticating device'
    });
  }
};

export default { protect, authorize, checkPermission, optionalAuth, authenticateDevice };
