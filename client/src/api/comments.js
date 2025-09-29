import API from './http';

const commentsAPI = {
  // Get comments for a post
  getComments: (postId, params = {}) => {
    return API.get(`/comments/post/${postId}`, { params });
  },

  // Get single comment
  getComment: (commentId) => {
    return API.get(`/comments/${commentId}`);
  },

  // Create new comment
  createComment: (postId, commentData) => {
    // commentData: { body, parent? }
    return API.post(`/comments/post/${postId}`, commentData);
  },

  // Reply to a comment
  replyToComment: (commentId, replyData) => {
    return API.post(`/comments/${commentId}/replies`, replyData);
  },

  // Update comment
  updateComment: (commentId, commentData) => {
    return API.put(`/comments/${commentId}`, commentData);
  },

  // Delete comment
  deleteComment: (commentId) => {
    return API.delete(`/comments/${commentId}`);
  },

  // Like/unlike comment
  toggleLike: (commentId) => {
    return API.post(`/comments/${commentId}/like`);
  },

  // Get user's comments
  getUserComments: (userId, params = {}) => {
    return API.get(`/users/${userId}/comments`, { params });
  },

  // Get replies for a comment
  getReplies: (commentId, params = {}) => {
    return API.get(`/comments/${commentId}/replies`, { params });
  },

  // Report comment
  reportComment: (commentId, reason) => {
    return API.post(`/comments/${commentId}/report`, { reason });
  },
};

export default commentsAPI;