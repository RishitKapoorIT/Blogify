const express = require('express');
const router = express.Router();

const {
  getPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  togglePostLike,
  uploadImage,
  getPostStats
} = require('../controllers/postController');

const {
  validatePost
} = require('../middleware/validation');

const { 
  authenticate, 
  optionalAuth, 
  requireOwnershipOrAdmin 
} = require('../middleware/auth');

const { 
  handleSingleImageUpload 
} = require('../utils/imageUpload');

// Normalize multipart body fields (e.g., tags[] -> tags)
const normalizePostBody = (req, _res, next) => {
  // Map tags[] to tags if needed
  if (req.body && req.body['tags[]'] && !req.body.tags) {
    req.body.tags = req.body['tags[]'];
  }
  // Ensure tags is always an array when present
  if (req.body && typeof req.body.tags === 'string') {
    req.body.tags = [req.body.tags];
  }
  // Coerce published to string 'true'/'false' or boolean
  if (req.body && typeof req.body.published === 'string') {
    if (req.body.published.toLowerCase() === 'true') req.body.published = 'true';
    if (req.body.published.toLowerCase() === 'false') req.body.published = 'false';
  }
  next();
};

// @route   GET /api/posts
// @desc    Get all published posts with pagination, search, and filtering
// @access  Public (with optional auth for like status)
router.get('/', optionalAuth, getPosts);

// @route   GET /api/posts/stats
// @desc    Get post statistics
// @access  Public
router.get('/stats', getPostStats);

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post(
  '/', 
  authenticate, 
  handleSingleImageUpload('coverImage'),
  normalizePostBody,
  validatePost, 
  createPost
);

// @route   POST /api/posts/upload-image
// @desc    Upload image for post content
// @access  Private
router.post(
  '/upload-image',
  authenticate,
  handleSingleImageUpload('image'),
  uploadImage
);

// @route   GET /api/posts/:slug
// @desc    Get single post by slug
// @access  Public (with optional auth for like status)
router.get('/:slug', optionalAuth, getPostBySlug);

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private (author or admin)
router.put(
  '/:id', 
  authenticate, 
  handleSingleImageUpload('coverImage'),
  normalizePostBody,
  validatePost,
  async (req, res, next) => {
    // Find post and attach to request for ownership check
    try {
      const Post = require('../models/Post');
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Post not found'
        });
      }
      req.post = post;
      next();
    } catch (error) {
      next(error);
    }
  },
  requireOwnershipOrAdmin('author'),
  updatePost
);

// @route   DELETE /api/posts/:id
// @desc    Delete post
// @access  Private (author or admin)
router.delete(
  '/:id', 
  authenticate,
  async (req, res, next) => {
    // Find post and attach to request for ownership check
    try {
      const Post = require('../models/Post');
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Post not found'
        });
      }
      req.post = post;
      next();
    } catch (error) {
      next(error);
    }
  },
  requireOwnershipOrAdmin('author'),
  deletePost
);

// @route   POST /api/posts/:id/like
// @desc    Toggle like on post
// @access  Private
router.post('/:id/like', authenticate, togglePostLike);

module.exports = router;