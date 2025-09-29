const mongoose = require('mongoose');
const slugify = require('slugify');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: 'text'
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    default: ''
  },
  contentDelta: {
    type: Object,
    required: [true, 'Content delta is required']
  },
  contentHtml: {
    type: String,
    required: [true, 'Content HTML is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
    index: true
  },
  coverImage: {
    type: String,
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters'],
    index: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  published: {
    type: Boolean,
    default: true,
    index: true
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  readTime: {
    type: Number, // in minutes
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes for efficient queries
postSchema.index({ published: 1, createdAt: -1 });
postSchema.index({ author: 1, published: 1, createdAt: -1 });
postSchema.index({ category: 1, published: 1, createdAt: -1 });
postSchema.index({ tags: 1, published: 1, createdAt: -1 });
postSchema.index({ featured: 1, published: 1, createdAt: -1 });

// Text index for search
postSchema.index({ 
  title: 'text', 
  excerpt: 'text', 
  contentHtml: 'text', 
  tags: 'text' 
}, {
  weights: {
    title: 10,
    excerpt: 5,
    tags: 3,
    contentHtml: 1
  }
});

// Pre-save hook to generate slug and calculate read time
postSchema.pre('save', function(next) {
  try {
    console.log('Pre-save hook triggered. isNew:', this.isNew, 'title modified:', this.isModified('title'), 'title:', this.title);
    
    // Generate slug if title is modified or document is new
    if (this.isModified('title') || this.isNew) {
      let baseSlug = slugify(this.title, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g
      });

      console.log('Generated base slug:', baseSlug, 'from title:', this.title);

      // Ensure slug is not empty
      if (!baseSlug || baseSlug.length === 0) {
        baseSlug = 'untitled';
        console.log('Base slug was empty, using fallback:', baseSlug);
      }

      // For now, just use the base slug with timestamp to ensure uniqueness
      // We'll implement proper async uniqueness check later
      const timestamp = Date.now();
      this.slug = `${baseSlug}-${timestamp}`;
      console.log('Final slug set to:', this.slug);
    }

    // Calculate read time if content is modified
    if (this.isModified('contentHtml')) {
      const wordsPerMinute = 200;
      const wordCount = this.contentHtml.replace(/<[^>]*>/g, '').split(/\s+/).length;
      this.readTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
      console.log('Read time calculated:', this.readTime);
    }

    // Update updatedAt timestamp
    if (!this.isNew) {
      this.updatedAt = new Date();
    }

    console.log('Pre-save hook completed successfully');
    next();
  } catch (error) {
    console.error('Pre-save hook error:', error);
    next(error);
  }
});

// Pre-save hook to update likes count
postSchema.pre('save', function(next) {
  if (this.isModified('likes')) {
    this.likesCount = this.likes.length;
  }
  next();
});

// Method to add like
postSchema.methods.addLike = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    this.likesCount = this.likes.length;
  }
  return this.save();
};

// Method to remove like
postSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => !like.equals(userId));
  this.likesCount = this.likes.length;
  return this.save();
};

// Method to toggle like
postSchema.methods.toggleLike = function(userId) {
  const isLiked = this.likes.includes(userId);
  
  if (isLiked) {
    this.likes = this.likes.filter(like => !like.equals(userId));
  } else {
    this.likes.push(userId);
  }
  
  this.likesCount = this.likes.length;
  return this.save();
};

// Method to increment view count
postSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to increment comments count
postSchema.methods.incrementCommentsCount = function() {
  this.commentsCount += 1;
  return this.save();
};

// Method to decrement comments count
postSchema.methods.decrementCommentsCount = function() {
  this.commentsCount = Math.max(0, this.commentsCount - 1);
  return this.save();
};

// Static method to find published posts
postSchema.statics.findPublished = function(options = {}) {
  const {
    page = 1,
    limit = 10,
    author,
    category,
    tags,
    search,
    featured,
    sort = '-createdAt'
  } = options;

  const query = { published: true };

  // Add filters
  if (author) query.author = author;
  if (category) query.category = new RegExp(category, 'i');
  if (tags && tags.length > 0) query.tags = { $in: tags };
  if (featured !== undefined) query.featured = featured;

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  return this.find(query)
    .populate('author', 'name avatarUrl')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method to get post stats
postSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalPosts: { $sum: 1 },
        publishedPosts: {
          $sum: { $cond: [{ $eq: ['$published', true] }, 1, 0] }
        },
        totalViews: { $sum: '$viewCount' },
        totalLikes: { $sum: '$likesCount' },
        totalComments: { $sum: '$commentsCount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Post', postSchema);