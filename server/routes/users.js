const express = require('express');
const router = express.Router();

const {
  getUserProfile,
  updateProfile,
  getMyPosts,
  getMyDashboard,
  getDashboardStats,
  searchUsers,
  deactivateAccount,
  toggleBookmark,
  getMyBookmarks,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing
} = require('../controllers/userController');

const {
  validateProfileUpdate
} = require('../middleware/validation');

const { authenticate } = require('../middleware/auth');
const { handleSingleImageUpload } = require('../utils/imageUpload');

// @route   GET /api/users/search
// @desc    Search users by name or email
// @access  Private
router.get('/search', authenticate, searchUsers);

// @route   GET /api/users/me/posts
// @desc    Get current user's posts (including drafts)
// @access  Private
router.get('/me/posts', authenticate, getMyPosts);

// @route   GET /api/users/me/dashboard
// @desc    Get dashboard statistics and profile for current user
// @access  Private
router.get('/me/dashboard', authenticate, getMyDashboard);

// @route   PUT /api/users/me
// @desc    Update current user profile
// @access  Private
router.put(
  '/me', 
  authenticate, 
  handleSingleImageUpload('avatar'),
  validateProfileUpdate, 
  updateProfile
);

// @route   DELETE /api/users/me
// @desc    Deactivate current user account
// @access  Private
router.delete('/me', authenticate, deactivateAccount);

// @route   POST /api/users/me/bookmarks/:postId
// @desc    Toggle bookmark for a post
// @access  Private
router.post('/me/bookmarks/:postId', authenticate, toggleBookmark);

// @route   GET /api/users/me/bookmarks
// @desc    Get current user's bookmarked posts
// @access  Private
router.get('/me/bookmarks', authenticate, getMyBookmarks);

// Social features routes
// @route   POST /api/users/:userId/follow
// @desc    Follow a user
// @access  Private
router.post('/:userId/follow', authenticate, followUser);

// @route   DELETE /api/users/:userId/follow
// @desc    Unfollow a user
// @access  Private
router.delete('/:userId/follow', authenticate, unfollowUser);

// @route   GET /api/users/:userId/followers
// @desc    Get user's followers
// @access  Public
router.get('/:userId/followers', getFollowers);

// @route   GET /api/users/:userId/following
// @desc    Get users that this user is following
// @access  Public
router.get('/:userId/following', getFollowing);

// @route   GET /api/users/:id
// @desc    Get user profile and posts
// @access  Public
router.get('/:id', getUserProfile);

module.exports = router;