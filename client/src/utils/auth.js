// Authentication utilities for token management

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('accessToken', token);
    // Set axios default header if needed
    if (window.axios) {
      window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  } else {
    removeAuthToken();
  }
};

export const removeAuthToken = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // Remove axios default header if needed
  if (window.axios) {
    delete window.axios.defaults.headers.common['Authorization'];
  }
};

export const getStoredToken = () => {
  return localStorage.getItem('accessToken');
};

export const getStoredRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

export const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem('refreshToken', token);
  }
};

export const clearTokens = () => {
  removeAuthToken();
};

const authUtils = {
  setAuthToken,
  removeAuthToken,
  getStoredToken,
  getStoredRefreshToken,
  setRefreshToken,
  clearTokens
};

export default authUtils;