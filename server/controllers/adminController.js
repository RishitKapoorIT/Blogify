const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isActive,
      sort = '-createdAt'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Get users
    const users = await User.find(query)
      .select('-password -refreshTokens')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Get total count
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limitNum);

    // Get user statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const postStats = await Post.aggregate([
          { $match: { author: user._id } },
          {
            $group: {
              _id: null,
              totalPosts: { $sum: 1 },
              publishedPosts: {
                $sum: { $cond: [{ $eq: ['$published', true] }, 1, 0] }
              },
              totalViews: { $sum: '$viewCount' },
              totalLikes: { $sum: '$likesCount' }
            }
          }
        ]);

        const stats = postStats[0] || {
          totalPosts: 0,
          publishedPosts: 0,
          totalViews: 0,
          totalLikes: 0
        };

        return {
          ...user.toObject(),
          stats
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalUsers,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
};

// Update user role (admin only)
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Prevent admin from changing their own role
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot change your own role'
      });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      data: { user },
      message: `User role updated to ${role}`
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role'
    });
  }
};

// Toggle user active status (admin only)
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deactivating themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot change your own account status'
      });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    // If deactivating, remove all refresh tokens
    if (!user.isActive) {
      await user.removeAllRefreshTokens();
    }

    res.json({
      success: true,
      data: { user },
      message: `User account ${user.isActive ? 'activated' : 'deactivated'}`
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status'
    });
  }
};

// Get all posts for moderation (admin only)
const getAllPostsForModeration = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      author,
      category,
      published,
      featured,
      sort = '-createdAt'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Build query (admin can see all posts including unpublished)
    const query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (author) {
      query.author = author;
    }

    if (category) {
      query.category = new RegExp(category, 'i');
    }

    if (published !== undefined) {
      query.published = published === 'true';
    }

    if (featured !== undefined) {
      query.featured = featured === 'true';
    }

    // Get posts
    const posts = await Post.find(query)
      .populate('author', 'name email avatarUrl')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Get total count
    const totalPosts = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limitNum);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalPosts,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all posts for moderation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts for moderation'
    });
  }
};

// Delete post (admin only)
const deletePostAsAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Delete all comments associated with this post
    await Comment.deleteMany({ post: post._id });

    // Delete the post
    await post.deleteOne();

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post as admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post'
    });
  }
};

// Update post status (admin only)
const updatePostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { published, featured } = req.body;

    const post = await Post.findById(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    if (published !== undefined) {
      post.published = published;
    }

    if (featured !== undefined) {
      post.featured = featured;
    }

    await post.save();
    await post.populate('author', 'name email avatarUrl');

    res.json({
      success: true,
      data: { post },
      message: 'Post status updated successfully'
    });

  } catch (error) {
    console.error('Update post status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update post status'
    });
  }
};

// Get all comments for moderation (admin only)
const getAllCommentsForModeration = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      author,
      post,
      isDeleted,
      sort = '-createdAt'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Build query
    const query = {};

    if (author) {
      query.author = author;
    }

    if (post) {
      query.post = post;
    }

    if (isDeleted !== undefined) {
      query.isDeleted = isDeleted === 'true';
    }

    // Get comments
    const comments = await Comment.find(query)
      .populate('author', 'name email avatarUrl')
      .populate('post', 'title slug')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Get total count
    const totalComments = await Comment.countDocuments(query);
    const totalPages = Math.ceil(totalComments / limitNum);

    res.json({
      success: true,
      data: {
        comments,
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
    console.error('Get all comments for moderation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments for moderation'
    });
  }
};

// Delete comment (admin only)
const deleteCommentAsAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
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
    console.error('Delete comment as admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
};

// Get admin dashboard statistics
const getAdminStats = async (req, res) => {
  try {
    // Get overall statistics
    const [userStats, postStats, commentStats] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            admins: {
              $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
            }
          }
        }
      ]),
      Post.getStats(),
      Comment.getStats()
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentUsers, recentPosts, recentComments] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Post.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Comment.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    // Get top authors by post count
    const topAuthors = await Post.aggregate([
      { $match: { published: true } },
      {
        $group: {
          _id: '$author',
          postCount: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          totalLikes: { $sum: '$likesCount' }
        }
      },
      { $sort: { postCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: '$author' },
      {
        $project: {
          author: {
            name: '$author.name',
            email: '$author.email',
            avatarUrl: '$author.avatarUrl'
          },
          postCount: 1,
          totalViews: 1,
          totalLikes: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          users: userStats[0] || { totalUsers: 0, activeUsers: 0, admins: 0 },
          posts: postStats[0] || { totalPosts: 0, publishedPosts: 0, totalViews: 0, totalLikes: 0, totalComments: 0 },
          comments: commentStats[0] || { totalComments: 0, activeComments: 0, totalLikes: 0 }
        },
        recentActivity: {
          newUsers: recentUsers,
          newPosts: recentPosts,
          newComments: recentComments
        },
        topAuthors
      }
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin statistics'
    });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  getAllPostsForModeration,
  deletePostAsAdmin,
  updatePostStatus,
  getAllCommentsForModeration,
  deleteCommentAsAdmin,
  getAdminStats
};