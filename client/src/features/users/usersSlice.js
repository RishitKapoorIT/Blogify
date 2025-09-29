import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import usersAPI from '../../api/users';

// Async thunks
export const fetchUser = createAsyncThunk(
  'users/fetchUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getUser(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'users/updateProfile',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await usersAPI.updateProfile(formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const toggleFollow = createAsyncThunk(
  'users/toggleFollow',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await usersAPI.toggleFollow(userId);
      return { userId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle follow');
    }
  }
);

export const fetchFollowers = createAsyncThunk(
  'users/fetchFollowers',
  async ({ userId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getFollowers(userId, params);
      return { userId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch followers');
    }
  }
);

export const fetchFollowing = createAsyncThunk(
  'users/fetchFollowing',
  async ({ userId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getFollowing(userId, params);
      return { userId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch following');
    }
  }
);

export const fetchUserPosts = createAsyncThunk(
  'users/fetchUserPosts',
  async ({ userId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getUserPosts(userId, params);
      return { userId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user posts');
    }
  }
);

export const fetchUserComments = createAsyncThunk(
  'users/fetchUserComments',
  async ({ userId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getUserComments(userId, params);
      return { userId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user comments');
    }
  }
);

export const fetchUserLikedPosts = createAsyncThunk(
  'users/fetchUserLikedPosts',
  async ({ userId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getUserLikedPosts(userId, params);
      return { userId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch liked posts');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'users/searchUsers',
  async ({ query, params = {} }, { rejectWithValue }) => {
    try {
      const response = await usersAPI.searchUsers(query, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search users');
    }
  }
);

export const fetchUserStats = createAsyncThunk(
  'users/fetchUserStats',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getUserStats(userId);
      return { userId, stats: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user stats');
    }
  }
);

export const deactivateAccount = createAsyncThunk(
  'users/deactivateAccount',
  async (password, { rejectWithValue }) => {
    try {
      const response = await usersAPI.deactivateAccount(password);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to deactivate account');
    }
  }
);

// Initial state
const initialState = {
  profiles: {}, // { userId: userProfile }
  currentProfile: null,
  followers: {}, // { userId: [followers] }
  following: {}, // { userId: [following] }
  userPosts: {}, // { userId: [posts] }
  userComments: {}, // { userId: [comments] }
  userLikedPosts: {}, // { userId: [likedPosts] }
  userStats: {}, // { userId: stats }
  searchResults: [],
  isLoading: false,
  isUpdating: false,
  isFollowing: false,
  error: null,
  pagination: {
    followers: {
      currentPage: 1,
      totalPages: 1,
      total: 0
    },
    following: {
      currentPage: 1,
      totalPages: 1,
      total: 0
    },
    posts: {
      currentPage: 1,
      totalPages: 1,
      total: 0
    },
    comments: {
      currentPage: 1,
      totalPages: 1,
      total: 0
    }
  }
};

// Users slice
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentProfile: (state) => {
      state.currentProfile = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearUserData: (state, action) => {
      const userId = action.payload;
      if (userId) {
        delete state.profiles[userId];
        delete state.followers[userId];
        delete state.following[userId];
        delete state.userPosts[userId];
        delete state.userComments[userId];
        delete state.userLikedPosts[userId];
        delete state.userStats[userId];
      }
    },
    setUserPagination: (state, action) => {
      const { type, pagination } = action.payload;
      if (state.pagination[type]) {
        state.pagination[type] = { ...state.pagination[type], ...pagination };
      }
    },
    updateProfile: (state, action) => {
      const updatedProfile = action.payload;
      state.profiles[updatedProfile._id] = updatedProfile;
      if (state.currentProfile && state.currentProfile._id === updatedProfile._id) {
        state.currentProfile = updatedProfile;
      }
    },
    addFollower: (state, action) => {
      const { userId, follower } = action.payload;
      if (!state.followers[userId]) {
        state.followers[userId] = [];
      }
      state.followers[userId].unshift(follower);
    },
    removeFollower: (state, action) => {
      const { userId, followerId } = action.payload;
      if (state.followers[userId]) {
        state.followers[userId] = state.followers[userId].filter(
          follower => follower._id !== followerId
        );
      }
    },
    addFollowing: (state, action) => {
      const { userId, following } = action.payload;
      if (!state.following[userId]) {
        state.following[userId] = [];
      }
      state.following[userId].unshift(following);
    },
    removeFollowing: (state, action) => {
      const { userId, followingId } = action.payload;
      if (state.following[userId]) {
        state.following[userId] = state.following[userId].filter(
          user => user._id !== followingId
        );
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch user
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const user = action.payload;
        state.profiles[user._id] = user;
        state.currentProfile = user;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isUpdating = false;
        const updatedUser = action.payload;
        state.profiles[updatedUser._id] = updatedUser;
        if (state.currentProfile && state.currentProfile._id === updatedUser._id) {
          state.currentProfile = updatedUser;
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })

      // Toggle follow
      .addCase(toggleFollow.pending, (state) => {
        state.isFollowing = true;
        state.error = null;
      })
      .addCase(toggleFollow.fulfilled, (state, action) => {
        state.isFollowing = false;
        const { userId, isFollowing, followersCount } = action.payload;
        
        // Update profile followers count
        if (state.profiles[userId]) {
          state.profiles[userId].followersCount = followersCount;
          state.profiles[userId].isFollowing = isFollowing;
        }
        
        if (state.currentProfile && state.currentProfile._id === userId) {
          state.currentProfile.followersCount = followersCount;
          state.currentProfile.isFollowing = isFollowing;
        }
      })
      .addCase(toggleFollow.rejected, (state, action) => {
        state.isFollowing = false;
        state.error = action.payload;
      })

      // Fetch followers
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        const { userId, followers, pagination } = action.payload;
        state.followers[userId] = followers || [];
        if (pagination) {
          state.pagination.followers = pagination;
        }
      })

      // Fetch following
      .addCase(fetchFollowing.fulfilled, (state, action) => {
        const { userId, following, pagination } = action.payload;
        state.following[userId] = following || [];
        if (pagination) {
          state.pagination.following = pagination;
        }
      })

      // Fetch user posts
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        const { userId, posts, pagination } = action.payload;
        state.userPosts[userId] = posts || [];
        if (pagination) {
          state.pagination.posts = pagination;
        }
      })

      // Fetch user comments
      .addCase(fetchUserComments.fulfilled, (state, action) => {
        const { userId, comments, pagination } = action.payload;
        state.userComments[userId] = comments || [];
        if (pagination) {
          state.pagination.comments = pagination;
        }
      })

      // Fetch user liked posts
      .addCase(fetchUserLikedPosts.fulfilled, (state, action) => {
        const { userId, posts } = action.payload;
        state.userLikedPosts[userId] = posts || [];
      })

      // Search users
      .addCase(searchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload.users || action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch user stats
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        const { userId, stats } = action.payload;
        state.userStats[userId] = stats;
      })

      // Deactivate account
      .addCase(deactivateAccount.fulfilled, (state) => {
        // Clear all user data after successful deactivation
        state.profiles = {};
        state.currentProfile = null;
        state.followers = {};
        state.following = {};
        state.userPosts = {};
        state.userComments = {};
        state.userLikedPosts = {};
        state.userStats = {};
      });
  }
});

export const {
  clearError,
  clearCurrentProfile,
  clearSearchResults,
  clearUserData,
  setUserPagination,
  updateProfile,
  addFollower,
  removeFollower,
  addFollowing,
  removeFollowing
} = usersSlice.actions;

export default usersSlice.reducer;