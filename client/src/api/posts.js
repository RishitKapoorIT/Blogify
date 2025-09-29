import API from './http';

const postsAPI = {
  // Get all posts with pagination and filters
  getPosts: (params = {}) => {
    const { sortBy, sortOrder, ...rest } = params || {};
    let mapped = { ...rest };
    if (sortBy) {
      // Backend expects sort like '-createdAt'
      const prefix = sortOrder === 'asc' ? '' : '-';
      mapped.sort = `${prefix}${sortBy}`;
    }
    return API.get('/posts', { params: mapped });
  },

  // Get single post by slug
  getPost: (slug) => {
    return API.get(`/posts/${slug}`);
  },

  // Create new post
  createPost: (postData) => {
    // postData expected to be FormData with keys: title, excerpt, contentHtml, contentDelta, tags[], category, published, featured, coverImage
    return API.post('/posts', postData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Update post
  updatePost: (id, postData) => {
    // postData expected to be FormData similar to createPost
    return API.put(`/posts/${id}`, postData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Delete post
  deletePost: (id) => {
    return API.delete(`/posts/${id}`);
  },

  // Like/unlike post
  toggleLike: (id) => {
    return API.post(`/posts/${id}/like`);
  },

  // Get user's posts
  getUserPosts: (userId, params = {}) => {
    return API.get(`/users/${userId}/posts`, { params });
  },

  // Get posts by category
  getPostsByCategory: (category, params = {}) => {
    return API.get('/posts', { params: { ...params, category } });
  },

  // Get posts by tag
  getPostsByTag: (tag, params = {}) => {
    return API.get('/posts', { params: { ...params, tags: tag } });
  },

  // Search posts (server uses `search` query param via text index)
  searchPosts: (query, params = {}) => {
    return API.get('/posts', { params: { ...params, search: query } });
  },

  // Get trending posts
  getTrendingPosts: (params = {}) => {
    return API.get('/posts', { params: { ...params, sort: '-likesCount' } });
  },

  // Get recent posts
  getRecentPosts: (params = {}) => {
    return API.get('/posts', { params: { ...params, sort: '-createdAt' } });
  },
};

export default postsAPI;