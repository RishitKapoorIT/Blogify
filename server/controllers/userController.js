const User = require('../models/User');
const Post = require('../models/Post');
const { uploadAvatar, deleteImage } = require('../utils/imageUpload');

// Get user profile by ID
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Find user
    const user = await User.findById(id).select('-refreshTokens');
    
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's published posts
    const posts = await Post.find({ 
      author: id, 
      published: true 
    })
      .select('title slug excerpt coverImage tags category likesCount commentsCount viewCount createdAt')
      .sort('-createdAt')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Get total posts count
    const totalPosts = await Post.countDocuments({ 
      author: id, 
      published: true 
    });

    const totalPages = Math.ceil(totalPosts / limitNum);

    // Get user stats
    const userStats = await Post.aggregate([
      { $match: { author: user._id, published: true } },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          totalLikes: { $sum: '$likesCount' },
          totalComments: { $sum: '$commentsCount' }
        }
      }
    ]);

    const stats = userStats[0] || {
      totalPosts: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0
    };

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
          createdAt: user.createdAt
        },
        posts,
        stats,
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
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
};

// Update current user profile
const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update fields
    if (name !== undefined) {
      user.name = name.trim();
    }
    
    if (bio !== undefined) {
      user.bio = bio.trim();
    }

    // Handle avatar upload
    if (req.file) {
      try {
        // Delete old avatar if exists
        if (user.avatarUrl) {
          const publicId = user.avatarUrl.split('/').pop().split('.')[0];
          await deleteImage(`blogify/avatars/${publicId}`);
        }

        const uploadResult = await uploadAvatar(req.file.buffer, userId);
        user.avatarUrl = uploadResult.url;
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return res.status(400).json({
          success: false,
          error: 'Failed to upload avatar image'
        });
      }
    }

    await user.save();

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
          createdAt: user.createdAt
        }
      },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};

// Get current user's own posts (including drafts)
const getMyPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      published,
      sort = '-createdAt'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const userId = req.user._id;

    // Build query
    const query = { author: userId };
    
    if (published !== undefined) {
      query.published = published === 'true';
    }

    // Get posts
    const posts = await Post.find(query)
      .select('title slug excerpt coverImage tags category likesCount commentsCount viewCount published featured createdAt updatedAt')
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
    console.error('Get my posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your posts'
    });
  }
};

// Get user dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's post statistics
    const postStats = await Post.aggregate([
      { $match: { author: userId } },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          publishedPosts: {
            $sum: { $cond: [{ $eq: ['$published', true] }, 1, 0] }
          },
          draftPosts: {
            $sum: { $cond: [{ $eq: ['$published', false] }, 1, 0] }
          },
          totalViews: { $sum: '$viewCount' },
          totalLikes: { $sum: '$likesCount' },
          totalComments: { $sum: '$commentsCount' }
        }
      }
    ]);

    const stats = postStats[0] || {
      totalPosts: 0,
      publishedPosts: 0,
      draftPosts: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0
    };

    // Get recent posts
    const recentPosts = await Post.find({ author: userId })
      .select('title slug published likesCount commentsCount viewCount createdAt')
      .sort('-createdAt')
      .limit(5);

    // Get posts by month for chart data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const postsByMonth = await Post.aggregate([
      {
        $match: {
          author: userId,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        stats,
        recentPosts,
        postsByMonth
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
};

// Search users (for mentions, etc.)
const searchUsers = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }

    const users = await User.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
      .select('name avatarUrl bio')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
};

// Deactivate user account
const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required to deactivate account'
      });
    }

    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid password'
      });
    }

    // Deactivate account
    user.isActive = false;
    await user.save();

    // Remove all refresh tokens
    await user.removeAllRefreshTokens();

    // Clear refresh token cookie
    res.clearCookie('refreshToken', { path: '/api/auth' });

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate account'
    });
  }
};

const toggleBookmark = async (req, res) => {
    try {
      const userId = req.user._id;
      const { postId } = req.params;

      // Basic validation: ensure post exists and is published (simple for now)
      const post = await Post.findById(postId).select('_id published');
      if (!post || !post.published) {
        return res.status(404).json({ success: false, error: 'Post not found' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Toggle bookmark
      const before = user.bookmarks.some(id => id.equals(postId));
      await user.toggleBookmark(postId);
      const after = user.bookmarks.some(id => id.equals(postId));

      return res.json({
        success: true,
        data: {
          isBookmarked: after,
          action: after && !before ? 'bookmarked' : (!after && before ? 'unbookmarked' : 'no-change')
        }
      });

    } catch (error) {
      console.error('Toggle bookmark error:', error);
      res.status(500).json({ success: false, error: 'Failed to toggle bookmark' });
    }
  };

const getMyBookmarks = async (req, res) => {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 10 } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      const user = await User.findById(userId).select('bookmarks');
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const total = user.bookmarks.length;
      const totalPages = Math.max(1, Math.ceil(total / limitNum));
      const start = (pageNum - 1) * limitNum;
      const idsPage = user.bookmarks.slice(start, start + limitNum);

      // Fetch posts in the bookmarked order (most recent first by createdAt)
      const posts = await Post.find({ _id: { $in: idsPage }, published: true })
        .select('title slug excerpt coverImage tags category likesCount commentsCount viewCount readTime author createdAt')
        .populate('author', 'name avatarUrl')
        .sort('-createdAt');

      return res.json({
        success: true,
        data: {
          posts,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalPosts: total,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
          }
        }
      });

    } catch (error) {
      console.error('Get bookmarks error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch bookmarks' });
    }
  };

// Follow a user
const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    if (currentUser._id.equals(userId)) {
      return res.status(400).json({ success: false, error: 'Cannot follow yourself' });
    }
    
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ success: false, error: 'User to follow not found' });
    }
    
    await currentUser.followUser(userId);
    
    res.status(200).json({
      success: true,
      data: {
        message: `Now following ${userToFollow.name}`,
        isFollowing: true
      }
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to follow user' });
  }
};

// Unfollow a user
const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
      return res.status(404).json({ success: false, error: 'User to unfollow not found' });
    }
    
    await currentUser.unfollowUser(userId);
    
    res.status(200).json({
      success: true,
      data: {
        message: `Unfollowed ${userToUnfollow.name}`,
        isFollowing: false
      }
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ success: false, error: 'Failed to unfollow user' });
  }
};

// Get user's followers
const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findById(userId)
      .populate({
        path: 'followers',
        select: 'name email avatarUrl bio followersCount followingCount',
        options: {
          skip: (page - 1) * limit,
          limit: parseInt(limit)
        }
      });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const totalFollowers = user.followersCount;
    const totalPages = Math.ceil(totalFollowers / limit);
    
    res.status(200).json({
      success: true,
      data: {
        followers: user.followers,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalFollowers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch followers' });
  }
};

// Get user's following
const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findById(userId)
      .populate({
        path: 'following',
        select: 'name email avatarUrl bio followersCount followingCount',
        options: {
          skip: (page - 1) * limit,
          limit: parseInt(limit)
        }
      });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const totalFollowing = user.followingCount;
    const totalPages = Math.ceil(totalFollowing / limit);
    
    res.status(200).json({
      success: true,
      data: {
        following: user.following,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalFollowing,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch following' });
  }
};

// Get current user's dashboard (profile info + posts + stats)
const getMyDashboard = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const user = req.user;

    // Get user's posts (both published and unpublished)
    const posts = await Post.find({ author: user._id })
      .select('title slug excerpt coverImage tags category likesCount commentsCount viewCount published createdAt')
      .sort('-createdAt')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Get total posts count
    const totalPosts = await Post.countDocuments({ author: user._id });
    const totalPages = Math.ceil(totalPosts / limitNum);

    // Get user stats
    const userStats = await Post.aggregate([
      { $match: { author: user._id, published: true } },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          totalLikes: { $sum: '$likesCount' },
          totalComments: { $sum: '$commentsCount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          role: user.role,
          createdAt: user.createdAt,
          followersCount: user.followersCount,
          followingCount: user.followingCount
        },
        posts,
        stats: userStats[0] || { totalPosts: 0, totalViews: 0, totalLikes: 0, totalComments: 0 },
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
    console.error('Get my dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard'
    });
  }
};

module.exports = {
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
  getFollowing,
};