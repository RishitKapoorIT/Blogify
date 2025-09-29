import API from './http';

const adminAPI = {
  // Dashboard
  getDashboardStats: () => API.get('/admin/stats'),

  // Users
  getAllUsers: (params = {}) => API.get('/admin/users', { params }),
  updateUserRole: (userId, role) => API.put(`/admin/users/${userId}/role`, { role }),
  toggleUserStatus: (userId) => API.put(`/admin/users/${userId}/status`),

  // Posts
  getAllPosts: (params = {}) => API.get('/admin/posts', { params }),
  updatePostStatus: (postId, { published, featured }) => API.put(`/admin/posts/${postId}/status`, { published, featured }),
  deletePost: (postId) => API.delete(`/admin/posts/${postId}`),

  // Comments
  getAllComments: (params = {}) => API.get('/admin/comments', { params }),
  deleteComment: (commentId) => API.delete(`/admin/comments/${commentId}`),
};

export default adminAPI;