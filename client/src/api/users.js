import API from './http';

const usersAPI = {
  // Get a user's public profile (includes published posts, stats, and pagination)
  getUser: (userId, params = {}) => {
    return API.get(`/users/${userId}`, { params });
  },

  // Current user endpoints
  getMyPosts: (params = {}) => {
    return API.get('/users/me/posts', { params });
  },
  getMyDashboard: () => {
    return API.get('/users/me/dashboard');
  },
  // Bookmarks
  toggleBookmark: (postId) => {
    return API.post(`/users/me/bookmarks/${postId}`);
  },
  getMyBookmarks: (params = {}) => {
    return API.get('/users/me/bookmarks', { params });
  },

  // Update current user profile (supports multipart for avatar)
  updateProfile: (formData) => {
    return API.put('/users/me', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Follow/unfollow user (may be implemented later server-side)
  toggleFollow: (userId) => {
    return API.post(`/users/${userId}/follow`);
  },
  followUser: (userId) => {
    return API.post(`/users/${userId}/follow`);
  },
  unfollowUser: (userId) => {
    return API.delete(`/users/${userId}/follow`);
  },

  // Optional endpoints (server may not yet support these exact routes)
  getFollowers: (userId, params = {}) => {
    return API.get(`/users/${userId}/followers`, { params });
  },
  getFollowing: (userId, params = {}) => {
    return API.get(`/users/${userId}/following`, { params });
  },
  getUserPosts: (userId, params = {}) => {
    return API.get(`/users/${userId}/posts`, { params });
  },
  getUserComments: (userId, params = {}) => {
    return API.get(`/users/${userId}/comments`, { params });
  },
  getUserLikedPosts: (userId, params = {}) => {
    return API.get(`/users/${userId}/liked-posts`, { params });
  },

  // Search users — server expects `query` param
  searchUsers: (query, params = {}) => {
    return API.get('/users/search', { params: { ...params, query } });
  },

  // Deactivate current account
  deactivateAccount: (password) => {
    return API.delete('/users/me', { data: { password } });
  },
};

export default usersAPI;