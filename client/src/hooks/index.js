import { useSelector, useDispatch } from 'react-redux';
import { useMemo, useCallback } from 'react';

// Auth hooks
export const useAuth = () => {
  const auth = useSelector(state => state.auth);
  
  return useMemo(() => ({
    ...auth,
    // Prefer slice-provided flag; fallback to presence of user or token
    isAuthenticated: Boolean(auth.isAuthenticated || (auth.user && (auth.token || auth.accessToken))),
    // Provide a stable isLoading alias used by components
    isLoading: Boolean(auth.loading || auth.isLoading),
    isAdmin: auth.user?.role === 'admin',
    isModerator: auth.user?.role === 'admin' || auth.user?.role === 'moderator'
  }), [auth]);
};

// Posts hooks
export const usePosts = () => {
  const posts = useSelector(state => state.posts);
  return posts;
};

export const useCurrentPost = () => {
  const currentPost = useSelector(state => state.posts.currentPost);
  const isLoading = useSelector(state => state.posts.isLoading);
  return { currentPost, isLoading };
};

export const usePostsFilters = () => {
  const filters = useSelector(state => state.posts.filters);
  const dispatch = useDispatch();
  
  const setFilters = useCallback((newFilters) => {
    dispatch({ type: 'posts/setFilters', payload: newFilters });
  }, [dispatch]);
  
  const resetFilters = useCallback(() => {
    dispatch({ type: 'posts/resetFilters' });
  }, [dispatch]);
  
  return { filters, setFilters, resetFilters };
};

// Comments hooks
export const useComments = (postId) => {
  const commentsByPost = useSelector(state => state.comments.commentsByPost);
  const isLoading = useSelector(state => state.comments.isLoading);
  const isCreating = useSelector(state => state.comments.isCreating);
  const error = useSelector(state => state.comments.error);
  
  return useMemo(() => ({
    comments: commentsByPost[postId] || [],
    isLoading,
    isCreating,
    error
  }), [commentsByPost, postId, isLoading, isCreating, error]);
};

// Users hooks
export const useCurrentUser = () => {
  const user = useSelector(state => state.auth.user);
  const isLoading = useSelector(state => state.auth.isLoading);
  return { user, isLoading };
};

export const useUserProfile = (userId) => {
  const profiles = useSelector(state => state.users.profiles);
  const currentProfile = useSelector(state => state.users.currentProfile);
  const isLoading = useSelector(state => state.users.isLoading);
  
  return useMemo(() => {
    const profile = userId ? profiles[userId] : currentProfile;
    return { profile, isLoading };
  }, [profiles, currentProfile, userId, isLoading]);
};

// UI hooks
export const useUI = () => {
  const ui = useSelector(state => state.ui);
  const dispatch = useDispatch();
  
  const openModal = useCallback((modalName) => {
    dispatch({ type: 'ui/openModal', payload: modalName });
  }, [dispatch]);
  
  const closeModal = useCallback((modalName) => {
    dispatch({ type: 'ui/closeModal', payload: modalName });
  }, [dispatch]);
  
  const addToast = useCallback((toast) => {
    dispatch({ type: 'ui/addToast', payload: toast });
  }, [dispatch]);
  
  const removeToast = useCallback((toastId) => {
    dispatch({ type: 'ui/removeToast', payload: toastId });
  }, [dispatch]);
  
  return {
    ...ui,
    openModal,
    closeModal,
    addToast,
    removeToast
  };
};

export const useTheme = () => {
  const theme = useSelector(state => state.ui.theme);
  const dispatch = useDispatch();
  
  const setTheme = useCallback((newTheme) => {
    dispatch({ type: 'ui/setTheme', payload: newTheme });
  }, [dispatch]);
  
  const toggleTheme = useCallback(() => {
    dispatch({ type: 'ui/toggleTheme' });
  }, [dispatch]);
  
  return { theme, setTheme, toggleTheme };
};

export const useModals = () => {
  const modals = useSelector(state => state.ui.modals);
  const dispatch = useDispatch();
  
  const openModal = useCallback((modalName) => {
    dispatch({ type: 'ui/openModal', payload: modalName });
  }, [dispatch]);
  
  const closeModal = useCallback((modalName) => {
    dispatch({ type: 'ui/closeModal', payload: modalName });
  }, [dispatch]);
  
  const closeAllModals = useCallback(() => {
    dispatch({ type: 'ui/closeAllModals' });
  }, [dispatch]);
  
  return { modals, openModal, closeModal, closeAllModals };
};

export const useToasts = () => {
  const toasts = useSelector(state => state.ui.toasts);
  const dispatch = useDispatch();
  
  const addToast = useCallback((toast) => {
    dispatch({ type: 'ui/addToast', payload: toast });
  }, [dispatch]);
  
  const removeToast = useCallback((toastId) => {
    dispatch({ type: 'ui/removeToast', payload: toastId });
  }, [dispatch]);
  
  const clearToasts = useCallback(() => {
    dispatch({ type: 'ui/clearToasts' });
  }, [dispatch]);
  
  return { toasts, addToast, removeToast, clearToasts };
};

export const useLoading = () => {
  const loading = useSelector(state => state.ui.loading);
  const dispatch = useDispatch();
  
  const setLoading = useCallback((type, isLoading) => {
    dispatch({ type: 'ui/setLoading', payload: { type, isLoading } });
  }, [dispatch]);
  
  const setPageLoading = useCallback((isLoading) => {
    dispatch({ type: 'ui/setPageLoading', payload: isLoading });
  }, [dispatch]);
  
  const setComponentLoading = useCallback((isLoading) => {
    dispatch({ type: 'ui/setComponentLoading', payload: isLoading });
  }, [dispatch]);
  
  const setActionLoading = useCallback((isLoading) => {
    dispatch({ type: 'ui/setActionLoading', payload: isLoading });
  }, [dispatch]);
  
  return {
    ...loading,
    setLoading,
    setPageLoading,
    setComponentLoading,
    setActionLoading
  };
};

export const useSearch = () => {
  const search = useSelector(state => state.ui.search);
  const dispatch = useDispatch();
  
  const setSearchQuery = useCallback((query) => {
    dispatch({ type: 'ui/setSearchQuery', payload: query });
  }, [dispatch]);
  
  const setSearchFilters = useCallback((filters) => {
    dispatch({ type: 'ui/setSearchFilters', payload: filters });
  }, [dispatch]);
  
  const setSearchOpen = useCallback((isOpen) => {
    dispatch({ type: 'ui/setSearchOpen', payload: isOpen });
  }, [dispatch]);
  
  const setSearchResults = useCallback((results) => {
    dispatch({ type: 'ui/setSearchResults', payload: results });
  }, [dispatch]);
  
  const clearSearchResults = useCallback(() => {
    dispatch({ type: 'ui/clearSearchResults' });
  }, [dispatch]);
  
  return {
    ...search,
    setSearchQuery,
    setSearchFilters,
    setSearchOpen,
    setSearchResults,
    clearSearchResults
  };
};

export const useConfirmDialog = () => {
  const confirmDialog = useSelector(state => state.ui.confirmDialog);
  const dispatch = useDispatch();
  
  const openConfirmDialog = useCallback((options) => {
    dispatch({ type: 'ui/openConfirmDialog', payload: options });
  }, [dispatch]);
  
  const closeConfirmDialog = useCallback(() => {
    dispatch({ type: 'ui/closeConfirmDialog' });
  }, [dispatch]);
  
  return {
    ...confirmDialog,
    openConfirmDialog,
    closeConfirmDialog
  };
};

// Utility hooks for common operations
export const useApiError = () => {
  const { addToast } = useToasts();
  
  const handleApiError = useCallback((error, defaultMessage = 'An error occurred') => {
    const message = error?.response?.data?.message || error?.message || defaultMessage;
    addToast({
      type: 'error',
      message,
      duration: 5000
    });
  }, [addToast]);
  
  return { handleApiError };
};

export const useApiSuccess = () => {
  const { addToast } = useToasts();
  
  const showSuccess = useCallback((message, duration = 3000) => {
    addToast({
      type: 'success',
      message,
      duration
    });
  }, [addToast]);
  
  return { showSuccess };
};