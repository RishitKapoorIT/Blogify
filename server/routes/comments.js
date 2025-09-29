const express = require('express');
const router = express.Router();

const {
  getCommentsByPost,
  getReplies,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
  getCommentStats
} = require('../controllers/commentController');

const {
  validateComment
} = require('../middleware/validation');

const { 
  authenticate, 
  optionalAuth, 
  requireOwnershipOrAdmin 
} = require('../middleware/auth');

// @route   GET /api/comments/stats
// @desc    Get comment statistics
// @access  Public
router.get('/stats', getCommentStats);

// @route   GET /api/comments/post/:postId
// @desc    Get comments for a specific post
// @access  Public (with optional auth for like status)
router.get('/post/:postId', optionalAuth, getCommentsByPost);

// @route   GET /api/comments/:commentId/replies
// @desc    Get replies for a specific comment
// @access  Public (with optional auth for like status)
router.get('/:commentId/replies', optionalAuth, getReplies);

// @route   POST /api/comments/post/:postId
// @desc    Create a new comment on a post
// @access  Private
router.post('/post/:postId', authenticate, validateComment, createComment);

// @route   PUT /api/comments/:id
// @desc    Update comment
// @access  Private (author only)
router.put(
  '/:id', 
  authenticate, 
  validateComment,
  async (req, res, next) => {
    // Find comment and attach to request for ownership check
    try {
      const Comment = require('../models/Comment');
      const comment = await Comment.findById(req.params.id);
      if (!comment || comment.isDeleted) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found'
        });
      }
      req.comment = comment;
      next();
    } catch (error) {
      next(error);
    }
  },
  requireOwnershipOrAdmin('author'),
  updateComment
);

// @route   DELETE /api/comments/:id
// @desc    Delete comment (soft delete)
// @access  Private (author or admin)
router.delete(
  '/:id', 
  authenticate,
  async (req, res, next) => {
    // Find comment and attach to request for ownership check
    try {
      const Comment = require('../models/Comment');
      const comment = await Comment.findById(req.params.id);
      if (!comment || comment.isDeleted) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found'
        });
      }
      req.comment = comment;
      next();
    } catch (error) {
      next(error);
    }
  },
  requireOwnershipOrAdmin('author'),
  deleteComment
);

// @route   POST /api/comments/:id/like
// @desc    Toggle like on comment
// @access  Private
router.post('/:id/like', authenticate, toggleCommentLike);

module.exports = router;