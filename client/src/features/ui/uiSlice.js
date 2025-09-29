import { createSlice } from '@reduxjs/toolkit';

// Initial state for UI-related states
const initialState = {
  theme: 'light', // 'light' | 'dark'
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  modals: {
    login: false,
    register: false,
    createPost: false,
    editPost: false,
    deletePost: false,
    editProfile: false,
    changePassword: false,
    confirmDialog: false
  },
  loading: {
    page: false,
    component: false,
    action: false
  },
  notifications: [], // Array of notification objects
  toasts: [], // Array of toast messages
  search: {
    query: '',
    filters: {
      type: 'all', // 'all' | 'posts' | 'users'
      category: '',
      tags: [],
      dateRange: null,
      sortBy: 'relevance'
    },
    isOpen: false,
    results: {
      posts: [],
      users: [],
      total: 0
    },
    isSearching: false
  },
  editor: {
    isFullscreen: false,
    wordCount: 0,
    autosaved: true,
    lastSaved: null
  },
  pagination: {
    itemsPerPage: 10,
    currentPage: 1
  },
  layout: {
    containerWidth: 'max-w-6xl',
    showSidebar: true,
    showRightPanel: true
  },
  preferences: {
    emailNotifications: true,
    pushNotifications: true,
    autoSave: true,
    compactMode: false,
    showPreview: true
  },
  errors: {
    network: null,
    validation: {},
    general: null
  },
  confirmDialog: {
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null,
    variant: 'default' // 'default' | 'danger'
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme
    setTheme: (state, action) => {
      state.theme = action.payload;
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('blogify_theme', action.payload);
      }
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('blogify_theme', state.theme);
      }
    },

    // Sidebar
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },

    // Mobile menu
    setMobileMenuOpen: (state, action) => {
      state.mobileMenuOpen = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },

    // Modals
    openModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = true;
      }
    },
    closeModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = false;
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modal => {
        state.modals[modal] = false;
      });
    },

    // Loading states
    setLoading: (state, action) => {
      const { type, isLoading } = action.payload;
      if (state.loading.hasOwnProperty(type)) {
        state.loading[type] = isLoading;
      }
    },
    setPageLoading: (state, action) => {
      state.loading.page = action.payload;
    },
    setComponentLoading: (state, action) => {
      state.loading.component = action.payload;
    },
    setActionLoading: (state, action) => {
      state.loading.action = action.payload;
    },

    // Notifications
    addNotification: (state, action) => {
      const notification = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload
      };
      state.notifications.unshift(notification);
    },
    markNotificationRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    removeNotification: (state, action) => {
      const notificationId = action.payload;
      state.notifications = state.notifications.filter(n => n.id !== notificationId);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },

    // Toast messages
    addToast: (state, action) => {
      const toast = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        type: 'info', // 'success' | 'error' | 'warning' | 'info'
        duration: 5000,
        ...action.payload
      };
      state.toasts.push(toast);
    },
    removeToast: (state, action) => {
      const toastId = action.payload;
      state.toasts = state.toasts.filter(t => t.id !== toastId);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },

    // Search
    setSearchQuery: (state, action) => {
      state.search.query = action.payload;
    },
    setSearchFilters: (state, action) => {
      state.search.filters = { ...state.search.filters, ...action.payload };
    },
    resetSearchFilters: (state) => {
      state.search.filters = initialState.search.filters;
    },
    setSearchOpen: (state, action) => {
      state.search.isOpen = action.payload;
    },
    setSearchResults: (state, action) => {
      state.search.results = action.payload;
    },
    setSearching: (state, action) => {
      state.search.isSearching = action.payload;
    },
    clearSearchResults: (state) => {
      state.search.results = initialState.search.results;
      state.search.query = '';
    },

    // Editor
    setEditorFullscreen: (state, action) => {
      state.editor.isFullscreen = action.payload;
    },
    toggleEditorFullscreen: (state) => {
      state.editor.isFullscreen = !state.editor.isFullscreen;
    },
    setEditorWordCount: (state, action) => {
      state.editor.wordCount = action.payload;
    },
    setEditorAutosaved: (state, action) => {
      state.editor.autosaved = action.payload;
      if (action.payload) {
        state.editor.lastSaved = new Date().toISOString();
      }
    },

    // Pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    setItemsPerPage: (state, action) => {
      state.pagination.itemsPerPage = action.payload;
    },

    // Layout
    setLayout: (state, action) => {
      state.layout = { ...state.layout, ...action.payload };
    },
    setContainerWidth: (state, action) => {
      state.layout.containerWidth = action.payload;
    },
    toggleSidebarVisibility: (state) => {
      state.layout.showSidebar = !state.layout.showSidebar;
    },
    toggleRightPanel: (state) => {
      state.layout.showRightPanel = !state.layout.showRightPanel;
    },

    // Preferences
    setPreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('blogify_preferences', JSON.stringify(state.preferences));
      }
    },
    updatePreference: (state, action) => {
      const { key, value } = action.payload;
      if (state.preferences.hasOwnProperty(key)) {
        state.preferences[key] = value;
        if (typeof window !== 'undefined') {
          localStorage.setItem('blogify_preferences', JSON.stringify(state.preferences));
        }
      }
    },

    // Errors
    setError: (state, action) => {
      const { type, error } = action.payload;
      if (state.errors.hasOwnProperty(type)) {
        state.errors[type] = error;
      }
    },
    clearError: (state, action) => {
      const type = action.payload;
      if (state.errors.hasOwnProperty(type)) {
        state.errors[type] = null;
      }
    },
    clearAllErrors: (state) => {
      state.errors = initialState.errors;
    },
    setValidationError: (state, action) => {
      const { field, error } = action.payload;
      state.errors.validation[field] = error;
    },
    clearValidationError: (state, action) => {
      const field = action.payload;
      delete state.errors.validation[field];
    },
    clearValidationErrors: (state) => {
      state.errors.validation = {};
    },

    // Confirm Dialog
    openConfirmDialog: (state, action) => {
      state.confirmDialog = {
        ...initialState.confirmDialog,
        isOpen: true,
        ...action.payload
      };
    },
    closeConfirmDialog: (state) => {
      state.confirmDialog = initialState.confirmDialog;
    },

    // Reset UI state
    resetUI: (state) => {
      return {
        ...initialState,
        theme: state.theme, // Preserve theme
        preferences: state.preferences // Preserve preferences
      };
    }
  }
});

export const {
  setTheme,
  toggleTheme,
  setSidebarCollapsed,
  toggleSidebar,
  setMobileMenuOpen,
  toggleMobileMenu,
  openModal,
  closeModal,
  closeAllModals,
  setLoading,
  setPageLoading,
  setComponentLoading,
  setActionLoading,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  clearNotifications,
  addToast,
  removeToast,
  clearToasts,
  setSearchQuery,
  setSearchFilters,
  resetSearchFilters,
  setSearchOpen,
  setSearchResults,
  setSearching,
  clearSearchResults,
  setEditorFullscreen,
  toggleEditorFullscreen,
  setEditorWordCount,
  setEditorAutosaved,
  setPagination,
  setCurrentPage,
  setItemsPerPage,
  setLayout,
  setContainerWidth,
  toggleSidebarVisibility,
  toggleRightPanel,
  setPreferences,
  updatePreference,
  setError,
  clearError,
  clearAllErrors,
  setValidationError,
  clearValidationError,
  clearValidationErrors,
  openConfirmDialog,
  closeConfirmDialog,
  resetUI
} = uiSlice.actions;

export default uiSlice.reducer;