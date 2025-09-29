const User = require('../models/User');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  createTokenResponse,
  validatePasswordStrength,
  getRefreshTokenCookieOptions
} = require('../utils/auth');

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet requirements',
        details: passwordValidation.errors
      });
    }

  // Normalize email and check if user already exists
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password
    });

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    await user.addRefreshToken(refreshToken);

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Send response
    res.status(201).json(createTokenResponse(user, accessToken, refreshToken));

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    console.log('[Login] Request body:', { email: req.body.email, hasPassword: !!req.body.password });
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    console.log('[Login] User found:', { found: !!user, email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if account is active
    console.log('[Login] Account active:', { isActive: user.isActive });
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account has been deactivated'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    console.log('[Login] Password validation:', { isValid: isPasswordValid });
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate tokens
    console.log('[Login] Generating tokens for user:', { userId: user._id });
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    await user.addRefreshToken(refreshToken);
    console.log('[Login] Refresh token saved to user');

    // Set refresh token cookie
    const cookieOptions = getRefreshTokenCookieOptions();
    console.log('[Login] Setting refresh token cookie with options:', cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Remove password from user object
    user.password = undefined;

    // Send response
    const response = createTokenResponse(user, accessToken, refreshToken);
    console.log('[Login] Sending response:', { 
      success: response.success,
      hasAccessToken: !!response.data.accessToken,
      hasRefreshToken: !!response.data.refreshToken,
      userId: response.data.user.id
    });
    res.json(response);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.cookies;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);
    
    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId);
    
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

    // Check if refresh token exists in user's tokens array
    const tokenExists = user.refreshTokens.some(tokenObj => tokenObj.token === token);
    
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Remove old refresh token and add new one
    await user.removeRefreshToken(token);
    await user.addRefreshToken(newRefreshToken);

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, getRefreshTokenCookieOptions());

    // Send response
    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m'
      },
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    // Clear invalid refresh token cookie
    res.clearCookie('refreshToken', { path: '/api/auth' });
    
    res.status(401).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const { refreshToken: token } = req.cookies;
    const user = req.user;

    // Remove refresh token from user if it exists
    if (token && user) {
      await user.removeRefreshToken(token);
    }

    // Clear refresh token cookie with same options used to set it
    res.clearCookie('refreshToken', getRefreshTokenCookieOptions());

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    
    // Clear cookie even if there's an error
    res.clearCookie('refreshToken', { path: '/api/auth' });
    
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};

// Logout from all devices
const logoutAll = async (req, res) => {
  try {
    const user = req.user;

    // Remove all refresh tokens
    await user.removeAllRefreshTokens();

    // Clear refresh token cookie
    res.clearCookie('refreshToken', { path: '/api/auth' });

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });

  } catch (error) {
    console.error('Logout all error:', error);
    
    // Clear cookie even if there's an error
    res.clearCookie('refreshToken', { path: '/api/auth' });
    
    res.status(500).json({
      success: false,
      error: 'Logout from all devices failed'
    });
  }
};

// Get current user info
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'New password does not meet requirements',
        details: passwordValidation.errors
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Remove all refresh tokens (force re-login on all devices)
    await user.removeAllRefreshTokens();

    // Clear refresh token cookie
    res.clearCookie('refreshToken', { path: '/api/auth' });

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Password change failed'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getCurrentUser,
  changePassword
};