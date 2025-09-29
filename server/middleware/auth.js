const User = require('../models/User');
const { 
  verifyAccessToken, 
  extractTokenFromHeader 
} = require('../utils/auth');

// Middleware to authenticate user
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account has been deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid access token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Access token expired'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin privileges required'
    });
  }

  next();
};

// Middleware to check if user owns resource or is admin
const requireOwnershipOrAdmin = (resourceField = 'author') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check ownership based on the resource
    const resource = req.resource || req.post || req.comment || req.targetUser;
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    const ownerId = resource[resourceField]?.toString() || resource._id?.toString();
    const userId = req.user._id.toString();

    if (ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: insufficient permissions'
      });
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      req.user = null;
      return next();
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // On authentication error, continue without user
    req.user = null;
    next();
  }
};

// Middleware to validate refresh token from cookie
const validateRefreshToken = (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: 'Refresh token is required'
    });
  }

  req.refreshToken = refreshToken;
  next();
};

// Rate limiting middleware for sensitive operations
const sensitiveOperation = (req, res, next) => {
  // This can be enhanced with Redis for distributed rate limiting
  // For now, we rely on the global rate limiter
  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireOwnershipOrAdmin,
  optionalAuth,
  validateRefreshToken,
  sensitiveOperation
};