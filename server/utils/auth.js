const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate access token
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      issuer: 'blogify-api',
      audience: 'blogify-client'
    }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    tokenId: crypto.randomBytes(16).toString('hex'),
    type: 'refresh'
  };

  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'blogify-api',
      audience: 'blogify-client'
    }
  );
};

// Verify access token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'blogify-api',
      audience: 'blogify-client'
    });
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'blogify-api',
      audience: 'blogify-client'
    });
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

// Extract token from Authorization header
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

// Generate secure random string
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash token for database storage
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Create token response object
const createTokenResponse = (user, accessToken, refreshToken) => {
  return {
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt
      },
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    },
    message: 'Authentication successful'
  };
};

// Validate password strength
const validatePasswordStrength = (password) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasNonalphas = /\W/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  // Optional: Add more strict requirements
  if (process.env.NODE_ENV === 'production') {
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    // Uncomment for special character requirement
    // if (!hasNonalphas) {
    //   errors.push('Password must contain at least one special character');
    // }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Create cookie options for refresh token
const getRefreshTokenCookieOptions = () => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
    domain: process.env.COOKIE_DOMAIN || 'localhost'
  };
};

// Decode JWT without verification (for debugging)
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  generateSecureToken,
  hashToken,
  createTokenResponse,
  validatePasswordStrength,
  getRefreshTokenCookieOptions,
  decodeToken
};