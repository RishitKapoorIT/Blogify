const express = require('express');
const router = express.Router();

const {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getCurrentUser,
  changePassword
} = require('../controllers/authController');

const {
  validateRegistration,
  validateLogin,
  validatePasswordChange
} = require('../middleware/validation');

const { authenticate, validateRefreshToken } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegistration, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', (req, res, next) => {
  console.log('[Auth Route] Login request:', {
    headers: req.headers,
    cookies: req.cookies,
    body: { ...req.body, password: '***' }
  });
  next();
}, validateLogin, login);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token using refresh token
// @access  Public (but requires refresh token cookie)
router.post('/refresh-token', (req, res, next) => {
  console.log('[Auth Route] Refresh token request:', {
    headers: req.headers,
    cookies: req.cookies
  });
  next();
}, refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout user (remove refresh token)
// @access  Private
router.post('/logout', authenticate, logout);

// @route   POST /api/auth/logout-all
// @desc    Logout user from all devices
// @access  Private
router.post('/logout-all', authenticate, logoutAll);

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', authenticate, getCurrentUser);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticate, validatePasswordChange, changePassword);

module.exports = router;