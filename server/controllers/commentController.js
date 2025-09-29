const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { sanitizeComment } = require('../utils/sanitization');

// Get comments for a post
const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const {
      page = 1,
      limit = 20,
      sort = 'createdAt'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Get top-level comments (parent: null)
    const comments = await Comment.find({
      post: postId,
      parent: null,
      isDeleted: false
    })
      .populate('author', 'name avatarUrl')
      .sort(sort === 'oldest' ? 'createdAt' : '-createdAt')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // For each comment, get reply count and add isLiked field
    const commentsWithExtras = comments.map(comment => ({
      ...comment,
      isLiked: req.user ? comment.likes.some(like => like.toString() === req.user._id.toString()) : false,
      likes: undefined // Remove likes array for privacy, keep only count
    }));

    // Get total count for pagination
    const totalComments = await Comment.countDocuments({
      post: postId,
      parent: null,
      isDeleted: false
    });

    const totalPages = Math.ceil(totalComments / limitNum);

    res.json({
      success: true,
      data: {
        comments: commentsWithExtras,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalComments,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }
};

// Get replies for a comment
const getReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Verify parent comment exists
    const parentComment = await Comment.findById(commentId);
    if (!parentComment || parentComment.isDeleted) {
      return res.status(404).json({
        success: false,
        error: 'Parent comment not found'
      });
    }

    // Get replies
    const replies = await Comment.find({
      parent: commentId,
      isDeleted: false
    })
      .populate('author', 'name avatarUrl')
      .sort(sort === 'oldest' ? 'createdAt' : '-createdAt')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // Add isLiked field
    const repliesWithExtras = replies.map(reply => ({
      ...reply,
      isLiked: req.user ? reply.likes.some(like => like.toString() === req.user._id.toString()) : false,
      likes: undefined // Remove likes array for privacy
    }));

    // Get total count for pagination
    const totalReplies = await Comment.countDocuments({
      parent: commentId,
      isDeleted: false
    });

    const totalPages = Math.ceil(totalReplies / limitNum);

    res.json({
      success: true,
      data: {
        replies: repliesWithExtras,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalReplies,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch replies'
    });
  }
};

// Create new comment
const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { body, parent } = req.body;

    // Verify post exists and is published
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    if (!post.published) {
      return res.status(403).json({
        success: false,
        error: 'Cannot comment on unpublished post'
      });
    }

    // If this is a reply, verify parent comment exists
    if (parent) {
      const parentComment = await Comment.findById(parent);
      if (!parentComment || parentComment.isDeleted) {
        return res.status(404).json({
          success: false,
          error: 'Parent comment not found'
        });
      }

      // Ensure parent comment belongs to the same post
      if (parentComment.post.toString() !== postId) {
        return res.status(400).json({
          success: false,
          error: 'Parent comment does not belong to this post'
        });
      }
    }

    // Sanitize comment body
    const sanitizedBody = sanitizeComment(body);
    if (!sanitizedBody.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Comment body cannot be empty'
      });
    }

    // Create comment
    const comment = new Comment({
      post: postId,
      author: req.user._id,
      body: sanitizedBody,
      parent: parent || null
    });

    await comment.save();

    // Update post comments count (only for top-level comments)
    if (!parent) {
      await post.incrementCommentsCount();
    }

    // Populate author info for response
    await comment.populate('author', 'name avatarUrl');

    res.status(201).json({
      success: true,
      data: { 
        comment: {
          ...comment.toObject(),
          isLiked: false,
          likes: undefined
        }
      },
      message: 'Comment created successfully'
    });

  } catch (error) {
    console.error('Create comment error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create comment'
    });
  }
};

// Update comment
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body;

    const comment = await Comment.findById(id);
    
    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check ownership
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Sanitize new body
    const sanitizedBody = sanitizeComment(body);
    if (!sanitizedBody.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Comment body cannot be empty'
      });
    }

    comment.body = sanitizedBody;
    await comment.save();

    await comment.populate('author', 'name avatarUrl');

    res.json({
      success: true,
      data: { 
        comment: {
          ...comment.toObject(),
          isLiked: comment.likes.includes(req.user._id),
          likes: undefined
        }
      },
      message: 'Comment updated successfully'
    });

  } catch (error) {
    console.error('Update comment error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update comment'
    });
  }
};

// Delete comment (soft delete)
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    
    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check ownership or admin rights
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Soft delete the comment
    await comment.softDelete();

    // Decrease post comments count if it's a top-level comment
    if (!comment.parent) {
      const post = await Post.findById(comment.post);
      if (post) {
        await post.decrementCommentsCount();
      }
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
};

// Toggle comment like
const toggleCommentLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(id);
    
    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    const isLiked = comment.likes.includes(userId);
    
    if (isLiked) {
      await comment.removeLike(userId);
    } else {
      await comment.addLike(userId);
    }

    res.json({
      success: true,
      data: {
        isLiked: !isLiked,
        likesCount: comment.likesCount
      },
      message: isLiked ? 'Comment unliked' : 'Comment liked'
    });

  } catch (error) {
    console.error('Toggle comment like error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle like'
    });
  }
};

// Get comment statistics
const getCommentStats = async (req, res) => {
  try {
    const stats = await Comment.getStats();
    
    res.json({
      success: true,
      data: { stats: stats[0] || {} }
    });

  } catch (error) {
    console.error('Get comment stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get comment statistics'
    });
  }
};

module.exports = {
  getCommentsByPost,
  getReplies,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
  getCommentStats
};