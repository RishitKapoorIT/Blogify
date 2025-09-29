import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authAPI from '../../api/auth';
import { setAuthToken, removeAuthToken } from '../../utils/auth';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('accessToken'),
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      return rejectWithValue({
        message: errorMessage,
        status: error.response?.status
      });
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
  const response = await authAPI.register(userData);
  return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Registration failed'
      );
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      return rejectWithValue('No token found');
    }

    try {
      setAuthToken(token);
  const response = await authAPI.getCurrentUser();
  return response.data?.data || response.data;
    } catch (error) {
      removeAuthToken();
      localStorage.removeItem('accessToken');
      return rejectWithValue(
        error.response?.data?.error || 'Token validation failed'
      );
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
  const response = await authAPI.refreshToken();
  return response.data?.data || response.data;
    } catch (error) {
      removeAuthToken();
      localStorage.removeItem('accessToken');
      return rejectWithValue(
        error.response?.data?.error || 'Token refresh failed'
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      removeAuthToken();
      localStorage.removeItem('accessToken');
      return true;
    } catch (error) {
      // Even if logout fails on server, clear local state
      removeAuthToken();
      localStorage.removeItem('accessToken');
      return rejectWithValue(
        error.response?.data?.error || 'Logout failed'
      );
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await authAPI.updateProfile(formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Profile update failed'
      );
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      await authAPI.changePassword(passwordData);
      return true;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Password change failed'
      );
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      removeAuthToken();
      localStorage.removeItem('accessToken');
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;
        
        // Store token in localStorage and set auth header
        localStorage.setItem('accessToken', action.payload.accessToken);
        setAuthToken(action.payload.accessToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;
        
        // Store token in localStorage and set auth header
        localStorage.setItem('accessToken', action.payload.accessToken);
        setAuthToken(action.payload.accessToken);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      
      // Refresh Token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.accessToken;
        localStorage.setItem('accessToken', action.payload.accessToken);
        setAuthToken(action.payload.accessToken);
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, ...action.payload.user };
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        // Password change forces re-login, so clear auth state
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearAuth } = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;