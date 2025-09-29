import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import usersAPI from '../api/users';
import postsAPI from '../api/posts';
import { extractTextFromHtml } from '../utils';

const MyPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await usersAPI.getMyPosts({ page: 1, limit: 20 });
      if (data?.success) {
        setPosts(data.data.posts || []);
      } else {
        setError('Failed to load posts');
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const togglePublishStatus = async (post) => {
    setActionLoading(prev => ({ ...prev, [post._id]: true }));
    try {
      const formData = new FormData();
      formData.append('title', post.title);
      formData.append('excerpt', post.excerpt || '');
      formData.append('contentHtml', post.contentHtml || '');
      // Ensure a valid Quill Delta structure
      let delta = post.contentDelta;
      if (!delta || !Array.isArray(delta.ops)) {
        const plain = extractTextFromHtml(post.contentHtml || '');
        delta = { ops: [{ insert: `${plain}\n` }] };
      }
      formData.append('contentDelta', JSON.stringify(delta));
      formData.append('category', post.category || '');
      formData.append('published', String(!post.published));
      
      if (post.tags && post.tags.length > 0) {
        const cleanTags = post.tags
          .map(t => (t || '').toString().trim())
          .map(t => t.replace(/^#/, '').replace(/[^a-zA-Z0-9\s-]/g, '').toLowerCase())
          .filter(Boolean);
        cleanTags.forEach(tag => formData.append('tags[]', tag));
      }

      await postsAPI.updatePost(post._id, formData);
      loadPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      const details = error?.response?.data?.details?.map(d => d.message).join('\n');
      setError(error?.response?.data?.error || error?.response?.data?.message || details || 'Failed to update post');
    } finally {
      setActionLoading(prev => ({ ...prev, [post._id]: false }));
    }
  };

  const deletePost = async (post) => {
    if (!window.confirm(`Are you sure you want to delete "${post.title}"?`)) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [post._id]: true }));
    try {
      await postsAPI.deletePost(post._id);
      setPosts(prev => prev.filter(p => p._id !== post._id));
    } catch (error) {
      console.error('Error deleting post:', error);
      setError(error?.response?.data?.error || 'Failed to delete post');
    } finally {
      setActionLoading(prev => ({ ...prev, [post._id]: false }));
    }
  };

  const publishedPosts = posts.filter(p => p.published);
  const draftPosts = posts.filter(p => !p.published);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Posts</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {posts.length > 0 
                ? `${publishedPosts.length} published, ${draftPosts.length} drafts`
                : 'Start writing your first post'
              }
            </p>
          </div>
          <Link 
            to="/create" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            New Post
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Loading your posts...</span>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start sharing your thoughts with the world.
            </p>
            <Link 
              to="/create" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Write Your First Post
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        post.published 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                      <time className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </time>
                    </div>
                    
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {post.published ? (
                        <Link to={`/post/${post.slug}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                          {post.title}
                        </Link>
                      ) : (
                        post.title
                      )}
                    </h2>
                    
                    {post.excerpt && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    {post.tags && post.tags.slice(0, 3).map((tag) => (
                      <span 
                        key={tag} 
                        className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link 
                      to={`/edit/${post.slug}`} 
                      className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                      Edit
                    </Link>
                    
                    <button 
                      onClick={() => togglePublishStatus(post)}
                      disabled={actionLoading[post._id]}
                      className={`px-3 py-2 text-sm font-medium rounded transition-colors disabled:opacity-50 ${
                        post.published
                          ? 'text-orange-700 bg-orange-100 hover:bg-orange-200'
                          : 'text-green-700 bg-green-100 hover:bg-green-200'
                      }`}
                    >
                      {actionLoading[post._id] ? 'Loading...' : (post.published ? 'Unpublish' : 'Publish')}
                    </button>
                    
                    <button 
                      onClick={() => deletePost(post)}
                      disabled={actionLoading[post._id]}
                      className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyPostsPage;