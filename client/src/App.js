import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuth } from './features/auth/authSlice';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import PostDetailPage from './pages/PostDetailPage';
import CreateEditPostPage from './pages/CreateEditPostPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import MyPostsPage from './pages/MyPostsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminPostsPage from './pages/AdminPostsPage';
import AdminCommentsPage from './pages/AdminCommentsPage';
import MyBookmarksPage from './pages/MyBookmarksPage';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if user is authenticated on app load
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/post/:slug" element={<PostDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        
        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes (require authentication) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/create" element={<CreateEditPostPage />} />
          <Route path="/edit/:slug" element={<CreateEditPostPage />} />
          <Route path="/my-posts" element={<MyPostsPage />} />
          <Route path="/my-bookmarks" element={<MyBookmarksPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/posts" element={<AdminPostsPage />} />
          <Route path="/admin/comments" element={<AdminCommentsPage />} />
        </Route>
        
        {/* 404 page - fallback route */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600 mb-6">Page not found</p>
              <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg">
                Go Home
              </a>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;