import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import postsAPI from '../../api/posts';

// Async thunks
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await postsAPI.getPosts(params);
      return response.data?.data || response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to fetch posts';
      return rejectWithValue(msg);
    }
  }
);

export const fetchPost = createAsyncThunk(
  'posts/fetchPost',
  async (id, { rejectWithValue }) => {
    try {
      const response = await postsAPI.getPost(id);
      return response.data?.data?.post || response.data?.data || response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to fetch post';
      return rejectWithValue(msg);
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (postData, { rejectWithValue }) => {
    try {
      const response = await postsAPI.createPost(postData);
      return response.data?.data?.post || response.data?.data || response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to create post';
      return rejectWithValue(msg);
    }
  }
);

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async ({ id, postData }, { rejectWithValue }) => {
    try {
      const response = await postsAPI.updatePost(id, postData);
      return response.data?.data?.post || response.data?.data || response.data;
    } catch (error) {
      const details = error.response?.data?.details?.map(d => d.message).join('\n');
      const msg = error.response?.data?.message || error.response?.data?.error || details || 'Failed to update post';
      return rejectWithValue(msg);
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (id, { rejectWithValue }) => {
    try {
      await postsAPI.deletePost(id);
      return id;
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to delete post';
      return rejectWithValue(msg);
    }
  }
);

export const toggleLike = createAsyncThunk(
  'posts/toggleLike',
  async (id, { rejectWithValue }) => {
    try {
      const response = await postsAPI.toggleLike(id);
      const data = response.data?.data || response.data;
      return { id, ...data };
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to toggle like';
      return rejectWithValue(msg);
    }
  }
);

export const searchPosts = createAsyncThunk(
  'posts/searchPosts',
  async ({ query, params = {} }, { rejectWithValue }) => {
    try {
      const response = await postsAPI.searchPosts(query, params);
      return response.data?.data || response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to search posts';
      return rejectWithValue(msg);
    }
  }
);

export const fetchUserPosts = createAsyncThunk(
  'posts/fetchUserPosts',
  async ({ userId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await postsAPI.getUserPosts(userId, params);
      return response.data?.data || response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to fetch user posts';
      return rejectWithValue(msg);
    }
  }
);

export const fetchTrendingPosts = createAsyncThunk(
  'posts/fetchTrendingPosts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await postsAPI.getTrendingPosts(params);
      return response.data?.data || response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to fetch trending posts';
      return rejectWithValue(msg);
    }
  }
);

// Initial state
const initialState = {
  posts: [],
  currentPost: null,
  userPosts: [],
  trendingPosts: [],
  searchResults: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
    hasNextPage: false,
    hasPrevPage: false
  },
  filters: {
    category: '',
    tags: [],
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null
};

// Posts slice
const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPost: (state) => {
      state.currentPost = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    addPost: (state, action) => {
      state.posts.unshift(action.payload);
    },
    updatePostInList: (state, action) => {
      const index = state.posts.findIndex(post => post._id === action.payload._id);
      if (index !== -1) {
        state.posts[index] = action.payload;
      }
    },
    removePostFromList: (state, action) => {
      state.posts = state.posts.filter(post => post._id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch posts
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload;
        state.posts = payload.posts || payload;
        if (payload.pagination) {
          state.pagination = payload.pagination;
        }
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch single post
      .addCase(fetchPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPost = action.payload;
      })
      .addCase(fetchPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create post
      .addCase(createPost.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isCreating = false;
        state.posts.unshift(action.payload);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })

      // Update post
      .addCase(updatePost.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.posts.findIndex(post => post._id === action.payload._id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
        if (state.currentPost && state.currentPost._id === action.payload._id) {
          state.currentPost = action.payload;
        }
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })

      // Delete post
      .addCase(deletePost.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.posts = state.posts.filter(post => post._id !== action.payload);
        if (state.currentPost && state.currentPost._id === action.payload) {
          state.currentPost = null;
        }
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      })

      // Toggle like
      .addCase(toggleLike.fulfilled, (state, action) => {
        const { id, likesCount, isLiked } = action.payload;
        
        // Update in posts list
        const postIndex = state.posts.findIndex(post => post._id === id);
        if (postIndex !== -1) {
          state.posts[postIndex].likesCount = likesCount;
          state.posts[postIndex].isLiked = isLiked;
        }
        
        // Update current post
        if (state.currentPost && state.currentPost._id === id) {
          state.currentPost.likesCount = likesCount;
          state.currentPost.isLiked = isLiked;
        }
      })

      // Search posts
      .addCase(searchPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload;
        state.searchResults = payload.posts || payload;
      })
      .addCase(searchPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch user posts
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        const payload = action.payload;
        state.userPosts = payload.posts || payload;
      })

      // Fetch trending posts
      .addCase(fetchTrendingPosts.fulfilled, (state, action) => {
        const payload = action.payload;
        state.trendingPosts = payload.posts || payload;
      });
  }
});

export const {
  clearError,
  clearCurrentPost,
  clearSearchResults,
  setFilters,
  resetFilters,
  setPagination,
  addPost,
  updatePostInList,
  removePostFromList
} = postsSlice.actions;

export default postsSlice.reducer;