const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  avatarUrl: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'Role must be either user or admin'
    },
    default: 'user'
  },
  // Bookmarked posts (Reading List)
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    index: true
  }],
  // Social features
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }],
  // Social stats (for optimization)
  followersCount: {
    type: Number,
    default: 0
  },
  followingCount: {
    type: Number,
    default: 0
  },
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 7 * 24 * 60 * 60 // 7 days
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.refreshTokens;
      delete ret.__v;
      return ret;
    }
  }
});

// Index for email lookups
userSchema.index({ email: 1 });

// Index for role-based queries
userSchema.index({ role: 1 });

// Index for active users
userSchema.index({ isActive: 1 });
// Index for bookmarks lookups
userSchema.index({ bookmarks: 1 });

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to add refresh token
userSchema.methods.addRefreshToken = function(token) {
  this.refreshTokens.push({ token });
  return this.save();
};

// Method to remove refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(
    tokenObj => tokenObj.token !== token
  );
  return this.save();
};

// Method to remove all refresh tokens (logout from all devices)
userSchema.methods.removeAllRefreshTokens = function() {
  this.refreshTokens = [];
  return this.save();
};

// Toggle bookmark for a post
userSchema.methods.toggleBookmark = function(postId) {
  const exists = this.bookmarks.some(id => id.equals(postId));
  if (exists) {
    this.bookmarks = this.bookmarks.filter(id => !id.equals(postId));
  } else {
    this.bookmarks.push(postId);
  }
  return this.save();
};

// Follow a user
userSchema.methods.followUser = async function(userIdToFollow) {
  if (this._id.equals(userIdToFollow)) {
    throw new Error('Cannot follow yourself');
  }

  const isAlreadyFollowing = this.following.some(id => id.equals(userIdToFollow));
  if (!isAlreadyFollowing) {
    this.following.push(userIdToFollow);
    this.followingCount += 1;
    await this.save();

    // Update the followed user's followers
    const userToFollow = await this.constructor.findById(userIdToFollow);
    if (userToFollow) {
      const followerExists = userToFollow.followers.some(id => id.equals(this._id));
      if (!followerExists) {
        userToFollow.followers.push(this._id);
        userToFollow.followersCount += 1;
        await userToFollow.save();
      }
    }
  }
  return this;
};

// Unfollow a user
userSchema.methods.unfollowUser = async function(userIdToUnfollow) {
  const idx = this.following.findIndex(id => id.equals(userIdToUnfollow));
  if (idx > -1) {
    this.following.splice(idx, 1);
    this.followingCount = Math.max(0, this.followingCount - 1);
    await this.save();

    // Update the unfollowed user's followers
    const userToUnfollow = await this.constructor.findById(userIdToUnfollow);
    if (userToUnfollow) {
      const followerIdx = userToUnfollow.followers.findIndex(id => id.equals(this._id));
      if (followerIdx > -1) {
        userToUnfollow.followers.splice(followerIdx, 1);
        userToUnfollow.followersCount = Math.max(0, userToUnfollow.followersCount - 1);
        await userToUnfollow.save();
      }
    }
  }
  return this;
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

module.exports = mongoose.model('User', userSchema);