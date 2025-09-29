import API from './http';

const authAPI = {
  // Register new user
  register: (userData) => {
    return API.post('/auth/register', userData);
  },

  // Login user
  login: (credentials) => {
    return API.post('/auth/login', credentials);
  },

  // Get current user info
  getCurrentUser: () => {
    return API.get('/auth/me');
  },

  // Refresh access token
  refreshToken: () => {
    return API.post('/auth/refresh-token');
  },

  // Logout user
  logout: () => {
    return API.post('/auth/logout');
  },

  // Logout from all devices
  logoutAll: () => {
    return API.post('/auth/logout-all');
  },

  // Update user profile
  updateProfile: (formData) => {
    return API.put('/users/me', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Change password
  changePassword: (passwordData) => {
    return API.put('/auth/change-password', passwordData);
  },

  // Deactivate account
  deactivateAccount: (password) => {
    return API.delete('/users/me', { data: { password } });
  },
};

export default authAPI;