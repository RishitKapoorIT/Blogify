const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  getAllPostsForModeration,
  deletePostAsAdmin,
  updatePostStatus,
  getAllCommentsForModeration,
  deleteCommentAsAdmin,
  getAdminStats
} = require('../controllers/adminController');

const {
  validateRoleUpdate
} = require('../middleware/validation');

const { authenticate, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/stats', getAdminStats);

// User management routes
// @route   GET /api/admin/users
// @desc    Get all users with pagination and filtering
// @access  Private (Admin only)
router.get('/users', getAllUsers);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Admin only)
router.put('/users/:id/role', validateRoleUpdate, updateUserRole);

// @route   PUT /api/admin/users/:id/status
// @desc    Toggle user active status
// @access  Private (Admin only)
router.put('/users/:id/status', toggleUserStatus);

// Post management routes
// @route   GET /api/admin/posts
// @desc    Get all posts for moderation
// @access  Private (Admin only)
router.get('/posts', getAllPostsForModeration);

// @route   PUT /api/admin/posts/:id/status
// @desc    Update post status (published/featured)
// @access  Private (Admin only)
router.put('/posts/:id/status', updatePostStatus);

// @route   DELETE /api/admin/posts/:id
// @desc    Delete post (admin override)
// @access  Private (Admin only)
router.delete('/posts/:id', deletePostAsAdmin);

// Comment management routes
// @route   GET /api/admin/comments
// @desc    Get all comments for moderation
// @access  Private (Admin only)
router.get('/comments', getAllCommentsForModeration);

// @route   DELETE /api/admin/comments/:id
// @desc    Delete comment (admin override)
// @access  Private (Admin only)
router.delete('/comments/:id', deleteCommentAsAdmin);

module.exports = router;