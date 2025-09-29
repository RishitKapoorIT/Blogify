import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import postsReducer from './posts/postsSlice';
import commentsReducer from './comments/commentsSlice';
import usersReducer from './users/usersSlice';
import uiReducer from './ui/uiSlice';
import { customSerializableCheck } from './middleware/serializableCheck';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
    comments: commentsReducer,
    users: usersReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        isSerializable: customSerializableCheck.isSerializable,
        getEntries: customSerializableCheck.getEntries,
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'ui/openConfirmDialog',
          'ui/addToast',
          'auth/login/rejected'
        ],
        ignoredPaths: [
          'ui.confirmDialog.onConfirm',
          'ui.confirmDialog.onCancel',
          'error.stack',
          'error.message'
        ],
      },
    }),
});

// Export types for TypeScript usage (if needed)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;