import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import adminAPI from '../api/admin';
import { AdminRoute } from '../components/auth/ProtectedRoute';
import toast from 'react-hot-toast';

const AdminPostsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState({ page: 1, limit: 20, search: '', author: '', published: '', featured: '' });
  const [data, setData] = useState({ posts: [], pagination: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...q };
      if (!params.search) delete params.search;
      if (!params.author) delete params.author;
      if (params.published === '') delete params.published; else params.published = params.published === 'true';
      if (params.featured === '') delete params.featured; else params.featured = params.featured === 'true';
      const { data } = await adminAPI.getAllPosts(params);
      if (data?.success) setData(data.data); else setError('Failed to load posts');
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Initialize from URL once
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    setQ({
      page: Number(params.page) || 1,
      limit: Number(params.limit) || 20,
      search: params.search || '',
      author: params.author || '',
      published: params.published ?? '',
      featured: params.featured ?? ''
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch and sync URL when query changes
  useEffect(() => {
    fetchPosts();
    const next = { ...q };
    const sp = {};
    Object.keys(next).forEach(k => {
      const v = next[k];
      if (v !== '' && v !== undefined && v !== null) sp[k] = String(v);
    });
    setSearchParams(sp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.page, q.limit, q.search, q.author, q.published, q.featured]);

  const togglePublished = async (post) => {
    try {
      await adminAPI.updatePostStatus(post._id, { published: !post.published });
      toast.success(post.published ? 'Unpublished' : 'Published');
      fetchPosts();
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Failed to update');
    }
  };

  const toggleFeatured = async (post) => {
    try {
      await adminAPI.updatePostStatus(post._id, { featured: !post.featured });
      toast.success(post.featured ? 'Removed from featured' : 'Marked as featured');
      fetchPosts();
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Failed to update');
    }
  };

  const deletePost = async (post) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await adminAPI.deletePost(post._id);
      toast.success('Post deleted');
      fetchPosts();
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Failed to delete');
    }
  };

  return (
    <AdminRoute>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-4">
            <Link 
              to="/admin" 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Admin Dashboard
            </Link>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Post Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all posts, featured content, and publication status</p>
            </div>
            <div className="text-sm text-gray-500">{data.posts?.length || 0} of {data.pagination?.totalPosts || 0}</div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setQ({ ...q, page: 1 }); fetchPosts(); }} className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
            <input 
              value={q.search} 
              onChange={(e) => setQ({ ...q, search: e.target.value })} 
              placeholder="Search" 
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400" 
            />
            <input 
              value={q.author} 
              onChange={(e) => setQ({ ...q, author: e.target.value })} 
              placeholder="Author ID" 
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400" 
            />
            <select 
              value={q.published} 
              onChange={(e) => setQ({ ...q, published: e.target.value })} 
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All</option>
              <option value="true">Published</option>
              <option value="false">Unpublished</option>
            </select>
            <select 
              value={q.featured} 
              onChange={(e) => setQ({ ...q, featured: e.target.value })} 
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All</option>
              <option value="true">Featured</option>
              <option value="false">Not Featured</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Filter</button>
              <button type="button" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" onClick={() => setQ({ page: 1, limit: q.limit, search: '', author: '', published: '', featured: '' })}>Reset</button>
            </div>
          </form>

          {loading ? (
            <div>Loading…</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {(data.posts || []).map(p => (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{p.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{p.author?.name || p.author?.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            p.published 
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                              : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          }`}>{p.published ? 'Published' : 'Draft'}</span>
                          {p.featured && <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">Featured</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end">
                          <button onClick={() => togglePublished(p)} className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                            p.published 
                              ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500' 
                              : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                          }`}>{p.published ? 'Unpublish' : 'Publish'}</button>
                          <button onClick={() => toggleFeatured(p)} className={`inline-flex items-center px-3 py-1 border text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                            p.featured 
                              ? 'border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 focus:ring-blue-500' 
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-500'
                          }`}>{p.featured ? 'Unfeature' : 'Feature'}</button>
                          <button onClick={() => deletePost(p)} className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!!data.pagination?.totalPages && data.pagination.totalPages > 1 && (
                <div className="p-4 flex justify-center gap-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                  {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setQ({ ...q, page })}
                      className={`px-3 py-1 rounded border transition-colors ${
                        q.page === page 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Layout>
    </AdminRoute>
  );
};

export default AdminPostsPage;
