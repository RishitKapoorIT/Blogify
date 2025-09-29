const Post = require('../models/Post');
const Comment = require('../models/Comment');
const slugify = require('slugify');
const { 
  sanitizePostContent, 
  sanitizeDelta, 
  generateExcerpt,
  validateContentLength 
} = require('../utils/sanitization');
const { 
  uploadCoverImage, 
  uploadContentImage, 
  deleteImage 
} = require('../utils/imageUpload');

// Get all posts with pagination, search, and filtering
const getPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      author,
      category,
      tags,
      featured,
      sort = '-createdAt'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { published: true };

    // Add filters
    if (author) {
      query.author = author;
    }

    if (category) {
      query.category = new RegExp(category, 'i');
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray.map(tag => new RegExp(tag, 'i')) };
    }

    if (featured !== undefined) {
      query.featured = featured === 'true';
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Get posts with aggregation for better performance
    const projectStage = {
      $project: {
        _id: 1,
        title: 1,
        slug: 1,
        excerpt: 1,
        author: 1,
        coverImage: 1,
        tags: 1,
        category: 1,
        likesCount: 1,
        commentsCount: 1,
        viewCount: 1,
        readTime: 1,
        published: 1,
        featured: 1,
        createdAt: 1,
        updatedAt: 1,
        isLiked: req.user ? { 
          $in: [req.user._id, { $ifNull: ['$likes', []] }] 
        } : { $literal: false }
        // Remove isBookmarked from here since bookmarks are stored in User model
        // We handle this after the aggregation with post-processing
      }
    };

    // If we want isBookmarked, we need bookmarks relation; easiest is lookup user's bookmarks list and check inclusion.
    // Since bookmarks are stored on User, compute isBookmarked after fetch by comparing IDs when req.user is present.
    const posts = await Post.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
          pipeline: [
            { $project: { name: 1, avatarUrl: 1, bio: 1 } }
          ]
        }
      },
      { $unwind: '$author' },
      {
        $addFields: {
          score: search ? { $meta: 'textScore' } : 0
        }
      },
      { $sort: search ? { score: { $meta: 'textScore' }, createdAt: -1 } : getSortObject(sort) },
      { $skip: skip },
      { $limit: limitNum },
      projectStage
    ]);

    // Post-process to compute isBookmarked for all posts
    if (Array.isArray(posts)) {
      if (req.user) {
        // Fetch the user's bookmarks once
        const User = require('../models/User');
        const userDoc = await User.findById(req.user._id).select('bookmarks');
        const bookmarkSet = new Set((userDoc?.bookmarks || []).map(id => id.toString()));
        for (const p of posts) {
          p.isBookmarked = bookmarkSet.has(p._id.toString());
        }
      } else {
        // No user logged in, set all as not bookmarked
        for (const p of posts) {
          p.isBookmarked = false;
        }
      }
    }

    // Get total count for pagination
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
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts'
    });
  }
};

// Get single post by slug
const getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // First try to find a published post (available to everyone)
    let post = await Post.findOne({ slug, published: true })
      .populate('author', 'name avatarUrl bio createdAt')
      .lean();

    // If not found and user is authenticated, check for unpublished posts they own
    if (!post && req.user) {
      post = await Post.findOne({ slug, author: req.user._id })
        .populate('author', 'name avatarUrl bio createdAt')
        .lean();
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if current user liked the post
    const isLiked = req.user ? post.likes.some(like => like.toString() === req.user._id.toString()) : false;
    let isBookmarked = false;
    if (req.user) {
      const User = require('../models/User');
      const userDoc = await User.findById(req.user._id).select('bookmarks');
      if (userDoc) {
        isBookmarked = userDoc.bookmarks.some(id => id.toString() === post._id.toString());
      }
    }

    // Only increment view count for published posts
    if (post.published) {
      Post.findByIdAndUpdate(post._id, { $inc: { viewCount: 1 } }).exec();
    }

    // Add isLiked field to response
    const postResponse = {
      ...post,
      isLiked,
      isBookmarked,
      likes: undefined // Remove likes array from response for privacy
    };

    res.json({
      success: true,
      data: { post: postResponse }
    });

  } catch (error) {
    console.error('Get post by slug error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch post'
    });
  }
};

// Create new post
const createPost = async (req, res) => {
  try {
    console.log('=== CREATE POST DEBUG ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('=========================');
    
    const {
      title,
      excerpt,
      contentDelta,
      contentHtml,
      tags = [],
      category,
      published = true,
      featured = false
    } = req.body;

    // Parse contentDelta if it's a string (from FormData)
    let parsedContentDelta;
    try {
      parsedContentDelta = typeof contentDelta === 'string' 
        ? JSON.parse(contentDelta) 
        : contentDelta;
    } catch (error) {
      console.error('Error parsing contentDelta:', error);
      parsedContentDelta = null;
    }

    // Sanitize content
    const sanitizedHtml = sanitizePostContent(contentHtml);
    const sanitizedDelta = sanitizeDelta(parsedContentDelta);

    if (!sanitizedHtml || !sanitizedDelta) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or unsafe content'
      });
    }

    // Validate content length
    if (!validateContentLength(sanitizedHtml)) {
      return res.status(400).json({
        success: false,
        error: 'Content exceeds maximum length'
      });
    }

    // Generate excerpt if not provided
    const postExcerpt = excerpt || generateExcerpt(sanitizedHtml);

    // Create post object
    const postData = {
      title: title.trim(),
      excerpt: postExcerpt.trim(),
      contentDelta: sanitizedDelta,
      contentHtml: sanitizedHtml,
      author: req.user._id,
      tags: Array.isArray(tags) ? tags.map(tag => tag.trim().toLowerCase()).filter(Boolean) : (typeof tags === 'string' ? tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean) : []),
      category: category?.trim(),
      published: published === 'true' || published === true,
      featured: req.user.role === 'admin' ? (featured === 'true' || featured === true) : false
    };

    // Generate slug manually to bypass any schema issues
    let baseSlug = slugify(title.trim(), {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });

    // Ensure slug is not empty
    if (!baseSlug || baseSlug.length === 0) {
      baseSlug = 'untitled';
    }

    // For now, add timestamp to ensure uniqueness (we can optimize this later)
    const timestamp = Date.now();
    postData.slug = `${baseSlug}-${timestamp}`;
    
    console.log('Manually generated slug:', postData.slug);

    // Handle cover image upload
    if (req.file) {
      try {
        const uploadResult = await uploadCoverImage(req.file.buffer, `temp_${Date.now()}`);
        postData.coverImage = uploadResult.url;
      } catch (uploadError) {
        console.error('Cover image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          error: 'Failed to upload cover image'
        });
      }
    }

    // Create and save post
    const post = new Post(postData);
    await post.save();

    // Populate author info for response
    await post.populate('author', 'name avatarUrl');

    res.status(201).json({
      success: true,
      data: { post },
      message: 'Post created successfully'
    });

  } catch (error) {
    console.error('Create post error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create post'
    });
  }
};

// Update existing post
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      excerpt,
      contentDelta,
      contentHtml,
      category,
      published,
      featured
    } = req.body;

    // Support both 'tags' and 'tags[]' field names from multipart forms
    const incomingTags = req.body.tags !== undefined ? req.body.tags : req.body['tags[]'];

    // Find post
    const post = await Post.findById(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check ownership or admin rights
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Sanitize content if provided
    let sanitizedHtml = post.contentHtml;
    let sanitizedDelta = post.contentDelta;

    if (contentHtml && contentDelta) {
      // Parse contentDelta if sent as string (from FormData)
      let parsedDelta = contentDelta;
      if (typeof parsedDelta === 'string') {
        try {
          parsedDelta = JSON.parse(parsedDelta);
        } catch (e) {
          console.error('Error parsing contentDelta on update:', e);
          parsedDelta = null;
        }
      }

      sanitizedHtml = sanitizePostContent(contentHtml);
      sanitizedDelta = sanitizeDelta(parsedDelta);

      if (!sanitizedHtml || !sanitizedDelta) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or unsafe content'
        });
      }

      // Validate content length
      if (!validateContentLength(sanitizedHtml)) {
        return res.status(400).json({
          success: false,
          error: 'Content exceeds maximum length'
        });
      }
    }

    // Update post fields
    if (title !== undefined) post.title = title.trim();
    if (excerpt !== undefined) post.excerpt = excerpt.trim();
    if (sanitizedHtml !== post.contentHtml) {
      post.contentHtml = sanitizedHtml;
      post.contentDelta = sanitizedDelta;
    }
    if (incomingTags !== undefined) {
      const tags = incomingTags;
      post.tags = Array.isArray(tags)
        ? tags.map(tag => tag.trim().toLowerCase()).filter(Boolean)
        : (typeof tags === 'string'
            ? tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean)
            : []);
    }
    if (category !== undefined) post.category = category?.trim();
    if (published !== undefined) post.published = published;
    if (featured !== undefined && req.user.role === 'admin') post.featured = featured;

    // Handle cover image upload
    if (req.file) {
      try {
        // Delete old cover image if exists
        if (post.coverImage) {
          // Extract public ID from URL and delete
          const publicId = post.coverImage.split('/').pop().split('.')[0];
          await deleteImage(`blogify/covers/${publicId}`);
        }

        const uploadResult = await uploadCoverImage(req.file.buffer, post.slug);
        post.coverImage = uploadResult.url;
      } catch (uploadError) {
        console.error('Cover image upload error:', uploadError);
        // Don't fail the update if image upload fails
      }
    }

    // Generate excerpt if content changed and no excerpt provided
    if (!excerpt && sanitizedHtml !== post.contentHtml) {
      post.excerpt = generateExcerpt(sanitizedHtml);
    }

    await post.save();

    // Populate author info for response
    await post.populate('author', 'name avatarUrl');

    res.json({
      success: true,
      data: { post },
      message: 'Post updated successfully'
    });

  } catch (error) {
    console.error('Update post error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update post'
    });
  }
};

// Delete post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check ownership or admin rights
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Delete cover image from Cloudinary if exists
    if (post.coverImage) {
      try {
        const publicId = post.coverImage.split('/').pop().split('.')[0];
        await deleteImage(`blogify/covers/${publicId}`);
      } catch (imageError) {
        console.error('Error deleting cover image:', imageError);
      }
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
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post'
    });
  }
};

// Toggle post like
const togglePostLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    if (!post.published) {
      return res.status(403).json({
        success: false,
        error: 'Cannot like unpublished post'
      });
    }

    const isLiked = post.likes.includes(userId);
    
    if (isLiked) {
      await post.removeLike(userId);
    } else {
      await post.addLike(userId);
    }

    res.json({
      success: true,
      data: {
        isLiked: !isLiked,
        likesCount: post.likesCount
      },
      message: isLiked ? 'Post unliked' : 'Post liked'
    });

  } catch (error) {
    console.error('Toggle post like error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle like'
    });
  }
};

// Upload content image
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const uploadResult = await uploadContentImage(req.file.buffer);

    res.json({
      success: true,
      data: {
        url: uploadResult.url,
        publicId: uploadResult.publicId
      },
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
};

// Get post statistics
const getPostStats = async (req, res) => {
  try {
    const stats = await Post.getStats();
    
    res.json({
      success: true,
      data: { stats: stats[0] || {} }
    });

  } catch (error) {
    console.error('Get post stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get post statistics'
    });
  }
};

// Helper function to convert sort string to MongoDB sort object
const getSortObject = (sortString) => {
  const sortMap = {
    'createdAt': { createdAt: 1 },
    '-createdAt': { createdAt: -1 },
    'title': { title: 1 },
    '-title': { title: -1 },
    'likesCount': { likesCount: 1 },
    '-likesCount': { likesCount: -1 },
    'viewCount': { viewCount: 1 },
    '-viewCount': { viewCount: -1 },
    'commentsCount': { commentsCount: 1 },
    '-commentsCount': { commentsCount: -1 }
  };

  return sortMap[sortString] || { createdAt: -1 };
};

module.exports = {
  getPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  togglePostLike,
  uploadImage,
  getPostStats
};