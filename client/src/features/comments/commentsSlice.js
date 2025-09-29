import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import commentsAPI from '../../api/comments';

// Async thunks
export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async ({ postId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await commentsAPI.getComments(postId, params);
      const data = response.data?.data || response.data;
      return { postId, comments: data.comments || data, pagination: data.pagination };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch comments');
    }
  }
);

export const createComment = createAsyncThunk(
  'comments/createComment',
  async ({ postId, commentData }, { rejectWithValue }) => {
    try {
      const response = await commentsAPI.createComment(postId, commentData);
      return response.data?.data?.comment || response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create comment');
    }
  }
);

export const replyToComment = createAsyncThunk(
  'comments/replyToComment',
  async ({ commentId, replyData }, { rejectWithValue }) => {
    try {
      const response = await commentsAPI.replyToComment(commentId, replyData);
      const data = response.data?.data || response.data;
      return { parentId: commentId, reply: data.comment || data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reply to comment');
    }
  }
);

export const updateComment = createAsyncThunk(
  'comments/updateComment',
  async ({ commentId, commentData }, { rejectWithValue }) => {
    try {
      const response = await commentsAPI.updateComment(commentId, commentData);
      return response.data?.data?.comment || response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update comment');
    }
  }
);

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async (commentId, { rejectWithValue }) => {
    try {
      await commentsAPI.deleteComment(commentId);
      return commentId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete comment');
    }
  }
);

export const toggleCommentLike = createAsyncThunk(
  'comments/toggleLike',
  async (commentId, { rejectWithValue }) => {
    try {
      const response = await commentsAPI.toggleLike(commentId);
      const data = response.data?.data || response.data;
      return { id: commentId, ...data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle like');
    }
  }
);

export const fetchReplies = createAsyncThunk(
  'comments/fetchReplies',
  async ({ commentId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await commentsAPI.getReplies(commentId, params);
      const data = response.data?.data || response.data;
      return { parentId: commentId, replies: data.replies || data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch replies');
    }
  }
);

export const fetchUserComments = createAsyncThunk(
  'comments/fetchUserComments',
  async ({ userId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await commentsAPI.getUserComments(userId, params);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user comments');
    }
  }
);

export const reportComment = createAsyncThunk(
  'comments/reportComment',
  async ({ commentId, reason }, { rejectWithValue }) => {
    try {
      const response = await commentsAPI.reportComment(commentId, reason);
      return { commentId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to report comment');
    }
  }
);

// Helper function to build comment tree structure
const buildCommentTree = (comments) => {
  const commentMap = new Map();
  const rootComments = [];

  // First pass: create map of all comments
  comments.forEach(comment => {
    commentMap.set(comment._id, { ...comment, replies: [] });
  });

  // Second pass: build tree structure
  comments.forEach(comment => {
    if (comment.parent) {
      const parent = commentMap.get(comment.parent);
      if (parent) {
        parent.replies.push(commentMap.get(comment._id));
      }
    } else {
      rootComments.push(commentMap.get(comment._id));
    }
  });

  return rootComments;
};

// Initial state
const initialState = {
  commentsByPost: {}, // { postId: [comments] }
  userComments: [],
  currentReplies: {}, // { commentId: [replies] }
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalComments: 0,
    hasNextPage: false,
    hasPrevPage: false
  }
};

// Comments slice
const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearComments: (state, action) => {
      if (action.payload) {
        delete state.commentsByPost[action.payload];
      } else {
        state.commentsByPost = {};
      }
    },
    clearUserComments: (state) => {
      state.userComments = [];
    },
    clearReplies: (state, action) => {
      if (action.payload) {
        delete state.currentReplies[action.payload];
      } else {
        state.currentReplies = {};
      }
    },
    setCommentsPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    addComment: (state, action) => {
      const { postId, comment } = action.payload;
      if (!state.commentsByPost[postId]) {
        state.commentsByPost[postId] = [];
      }
      state.commentsByPost[postId].unshift(comment);
    },
    removeComment: (state, action) => {
      const { postId, commentId } = action.payload;
      if (state.commentsByPost[postId]) {
        state.commentsByPost[postId] = state.commentsByPost[postId].filter(
          comment => comment._id !== commentId
        );
      }
    },
    updateCommentInList: (state, action) => {
      const updatedComment = action.payload;
      
      // Update in all post comment lists
      Object.keys(state.commentsByPost).forEach(postId => {
        const index = state.commentsByPost[postId].findIndex(
          comment => comment._id === updatedComment._id
        );
        if (index !== -1) {
          state.commentsByPost[postId][index] = updatedComment;
        }
      });
      
      // Update in user comments
      const userCommentIndex = state.userComments.findIndex(
        comment => comment._id === updatedComment._id
      );
      if (userCommentIndex !== -1) {
        state.userComments[userCommentIndex] = updatedComment;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch comments
      .addCase(fetchComments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.isLoading = false;
        const { postId, comments, pagination } = action.payload;
        state.commentsByPost[postId] = buildCommentTree(comments || []);
        if (pagination) {
          state.pagination = pagination;
        }
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create comment
      .addCase(createComment.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.isCreating = false;
        const comment = action.payload;
        const postId = comment.post;
        
        if (!state.commentsByPost[postId]) {
          state.commentsByPost[postId] = [];
        }
        
        if (comment.parent) {
          // This is a reply - add to replies
          if (!state.currentReplies[comment.parent]) {
            state.currentReplies[comment.parent] = [];
          }
          state.currentReplies[comment.parent].push(comment);
        } else {
          // This is a top-level comment
          state.commentsByPost[postId].unshift(comment);
        }
      })
      .addCase(createComment.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })

      // Reply to comment
      .addCase(replyToComment.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(replyToComment.fulfilled, (state, action) => {
        state.isCreating = false;
        const { parentId, reply } = action.payload;
        
        if (!state.currentReplies[parentId]) {
          state.currentReplies[parentId] = [];
        }
        state.currentReplies[parentId].push(reply);
      })
      .addCase(replyToComment.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })

      // Update comment
      .addCase(updateComment.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        state.isUpdating = false;
        const updatedComment = action.payload;
        
        // Update in post comments
        Object.keys(state.commentsByPost).forEach(postId => {
          const updateInTree = (comments) => {
            return comments.map(comment => {
              if (comment._id === updatedComment._id) {
                return { ...comment, ...updatedComment };
              }
              if (comment.replies && comment.replies.length > 0) {
                return { ...comment, replies: updateInTree(comment.replies) };
              }
              return comment;
            });
          };
          
          state.commentsByPost[postId] = updateInTree(state.commentsByPost[postId]);
        });
      })
      .addCase(updateComment.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })

      // Delete comment
      .addCase(deleteComment.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.isDeleting = false;
        const commentId = action.payload;
        
        // Remove from all post comment lists
        Object.keys(state.commentsByPost).forEach(postId => {
          const removeFromTree = (comments) => {
            return comments.filter(comment => {
              if (comment._id === commentId) {
                return false;
              }
              if (comment.replies && comment.replies.length > 0) {
                comment.replies = removeFromTree(comment.replies);
              }
              return true;
            });
          };
          
          state.commentsByPost[postId] = removeFromTree(state.commentsByPost[postId]);
        });
        
        // Remove from user comments
        state.userComments = state.userComments.filter(
          comment => comment._id !== commentId
        );
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      })

      // Toggle comment like
      .addCase(toggleCommentLike.fulfilled, (state, action) => {
        const { id, likesCount, isLiked } = action.payload;
        
        // Update in all post comment lists
        Object.keys(state.commentsByPost).forEach(postId => {
          const updateLikesInTree = (comments) => {
            return comments.map(comment => {
              if (comment._id === id) {
                return { ...comment, likesCount, isLiked };
              }
              if (comment.replies && comment.replies.length > 0) {
                return { ...comment, replies: updateLikesInTree(comment.replies) };
              }
              return comment;
            });
          };
          
          state.commentsByPost[postId] = updateLikesInTree(state.commentsByPost[postId]);
        });
      })

      // Fetch replies
      .addCase(fetchReplies.fulfilled, (state, action) => {
        const { parentId, replies } = action.payload;
        state.currentReplies[parentId] = replies;
      })

      // Fetch user comments
      .addCase(fetchUserComments.fulfilled, (state, action) => {
        state.userComments = action.payload.comments || action.payload;
      })

      // Report comment
      .addCase(reportComment.fulfilled, (state, action) => {
        // Could add some UI feedback here if needed
      });
  }
});

export const {
  clearError,
  clearComments,
  clearUserComments,
  clearReplies,
  setCommentsPagination,
  addComment,
  removeComment,
  updateCommentInList
} = commentsSlice.actions;

export default commentsSlice.reducer;