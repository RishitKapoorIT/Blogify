const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Post reference is required'],
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
    index: true
  },
  body: {
    type: String,
    required: [true, 'Comment body is required'],
    trim: true,
    minlength: [1, 'Comment cannot be empty'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
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
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  repliesCount: {
    type: Number,
    default: 0
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
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
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ post: 1, parent: 1, createdAt: 1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parent: 1, createdAt: 1 });

// Pre-save hook to update likes count
commentSchema.pre('save', function(next) {
  if (this.isModified('likes')) {
    this.likesCount = this.likes.length;
  }
  next();
});

// Pre-save hook to handle edit tracking
commentSchema.pre('save', function(next) {
  if (this.isModified('body') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

// Post-save hook to update parent comment replies count
commentSchema.post('save', async function(doc) {
  if (doc.parent && !doc.isDeleted) {
    try {
      const parentComment = await this.constructor.findById(doc.parent);
      if (parentComment) {
        const repliesCount = await this.constructor.countDocuments({
          parent: doc.parent,
          isDeleted: false
        });
        parentComment.repliesCount = repliesCount;
        await parentComment.save();
      }
    } catch (error) {
      console.error('Error updating parent comment replies count:', error);
    }
  }
});

// Post-remove hook to update parent comment replies count
commentSchema.post('remove', async function(doc) {
  if (doc.parent) {
    try {
      const parentComment = await this.constructor.findById(doc.parent);
      if (parentComment) {
        const repliesCount = await this.constructor.countDocuments({
          parent: doc.parent,
          isDeleted: false
        });
        parentComment.repliesCount = repliesCount;
        await parentComment.save();
      }
    } catch (error) {
      console.error('Error updating parent comment replies count:', error);
    }
  }
});

// Method to add like
commentSchema.methods.addLike = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    this.likesCount = this.likes.length;
  }
  return this.save();
};

// Method to remove like
commentSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => !like.equals(userId));
  this.likesCount = this.likes.length;
  return this.save();
};

// Method to toggle like
commentSchema.methods.toggleLike = function(userId) {
  const isLiked = this.likes.includes(userId);
  
  if (isLiked) {
    this.likes = this.likes.filter(like => !like.equals(userId));
  } else {
    this.likes.push(userId);
  }
  
  this.likesCount = this.likes.length;
  return this.save();
};

// Method to soft delete
commentSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.body = '[This comment has been deleted]';
  return this.save();
};

// Method to restore
commentSchema.methods.restore = function(originalBody) {
  this.isDeleted = false;
  this.deletedAt = null;
  this.body = originalBody;
  return this.save();
};

// Static method to find comments by post
commentSchema.statics.findByPost = function(postId, options = {}) {
  const {
    page = 1,
    limit = 20,
    parent = null,
    sort = 'createdAt'
  } = options;

  const query = { 
    post: postId, 
    parent: parent,
    isDeleted: false 
  };

  return this.find(query)
    .populate('author', 'name avatarUrl')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method to find comment replies
commentSchema.statics.findReplies = function(parentId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sort = 'createdAt'
  } = options;

  return this.find({ 
    parent: parentId,
    isDeleted: false 
  })
    .populate('author', 'name avatarUrl')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method to get comment stats
commentSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalComments: { $sum: 1 },
        activeComments: {
          $sum: { $cond: [{ $eq: ['$isDeleted', false] }, 1, 0] }
        },
        totalLikes: { $sum: '$likesCount' }
      }
    }
  ]);
};

// Static method to get top level comments count for a post
commentSchema.statics.getTopLevelCount = function(postId) {
  return this.countDocuments({
    post: postId,
    parent: null,
    isDeleted: false
  });
};

module.exports = mongoose.model('Comment', commentSchema);