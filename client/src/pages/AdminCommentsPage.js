import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import adminAPI from '../api/admin';
import { AdminRoute } from '../components/auth/ProtectedRoute';
import toast from 'react-hot-toast';

const AdminCommentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState({ page: 1, limit: 50, author: '', post: '', isDeleted: '' });
  const [data, setData] = useState({ comments: [], pagination: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...q };
      if (!params.author) delete params.author;
      if (!params.post) delete params.post;
      if (params.isDeleted === '') delete params.isDeleted; else params.isDeleted = params.isDeleted === 'true';
      const { data } = await adminAPI.getAllComments(params);
      if (data?.success) setData(data.data); else setError('Failed to load comments');
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Initialize from URL once
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    setQ({
      page: Number(params.page) || 1,
      limit: Number(params.limit) || 50,
      author: params.author || '',
      post: params.post || '',
      isDeleted: params.isDeleted ?? ''
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch and sync URL when query changes
  useEffect(() => {
    fetchComments();
    const next = { ...q };
    const sp = {};
    Object.keys(next).forEach(k => {
      const v = next[k];
      if (v !== '' && v !== undefined && v !== null) sp[k] = String(v);
    });
    setSearchParams(sp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.page, q.limit, q.author, q.post, q.isDeleted]);

  const deleteComment = async (comment) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await adminAPI.deleteComment(comment._id);
      toast.success('Comment deleted');
      fetchComments();
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Failed to delete comment');
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comment Moderation</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Moderate comments and manage community discussions</p>
            </div>
            <div className="text-sm text-gray-500">{data.comments?.length || 0} of {data.pagination?.totalComments || 0}</div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setQ({ ...q, page: 1 }); fetchComments(); }} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            <input 
              value={q.author} 
              onChange={(e) => setQ({ ...q, author: e.target.value })} 
              placeholder="Author ID" 
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400" 
            />
            <input 
              value={q.post} 
              onChange={(e) => setQ({ ...q, post: e.target.value })} 
              placeholder="Post ID" 
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400" 
            />
            <select 
              value={q.isDeleted} 
              onChange={(e) => setQ({ ...q, isDeleted: e.target.value })} 
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All</option>
              <option value="false">Active</option>
              <option value="true">Deleted</option>
            </select>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Filter</button>
              <button type="button" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" onClick={() => setQ({ page: 1, limit: q.limit, author: '', post: '', isDeleted: '' })}>Reset</button>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Comment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Post</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {(data.comments || []).map(c => (
                    <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 max-w-xl">
                        <div className="text-sm text-gray-900 dark:text-white line-clamp-2">{c.content}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(c.createdAt).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{c.author?.name || c.author?.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{c.post?.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          c.isDeleted 
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                            : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        }`}>{c.isDeleted ? 'Deleted' : 'Active'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {!c.isDeleted && (
                          <button onClick={() => deleteComment(c)} className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">Delete</button>
                        )}
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

export default AdminCommentsPage;
