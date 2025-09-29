import axios from 'axios';

// Create axios instance
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  withCredentials: true, // Enable cookies for refresh tokens
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Removed unused apiBase variable
        console.log('[Token Refresh] Attempting token refresh');
                const refreshResponse = await API.post('/auth/refresh-token');
        console.log('[Token Refresh] Response:', refreshResponse.data);
        
        // Handle nested data structure
        const data = refreshResponse.data.data || refreshResponse.data;
        const token = data.accessToken;
        if (token) {
          localStorage.setItem('accessToken', token);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        // Optionally redirect
      }
    }
    // Global error handling
    const status = error.response?.status;
    const message = error.response?.data?.error || error.message || 'Network error';
    if (status >= 500) {
      console.error('Server error:', message);
    } else if (status >= 400) {
      console.warn('Client error:', message);
    } else if (!status) {
      console.error('Network error:', message);
    }
    return Promise.reject(error);
  }
);

export default API;
