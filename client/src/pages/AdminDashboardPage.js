import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import adminAPI from '../api/admin';
import { AdminRoute } from '../components/auth/ProtectedRoute';

const StatCard = ({ label, value, icon, color = 'blue', onClick }) => (
  <div 
    className={`p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</div>
      </div>
      {icon && (
        <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900`}>
          <div className={`text-${color}-600 dark:text-${color}-400`}>
            {icon}
          </div>
        </div>
      )}
    </div>
  </div>
);

const QuickActionCard = ({ title, description, icon, color, onClick, href }) => {
  const content = (
    <div className={`p-6 rounded-lg border-2 border-dashed border-${color}-300 dark:border-${color}-700 hover:border-${color}-400 dark:hover:border-${color}-600 hover:bg-${color}-50 dark:hover:bg-${color}-900/20 transition-all cursor-pointer group`}>
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900 group-hover:bg-${color}-200 dark:group-hover:bg-${color}-800 transition-colors`}>
          <div className={`text-${color}-600 dark:text-${color}-400`}>
            {icon}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return <div onClick={onClick}>{content}</div>;
};

const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await adminAPI.getDashboardStats();
      if (data?.success) {
        setStats(data.data);
        // Mock recent activity - in a real app, this would come from the API
        setRecentActivity([
          { type: 'user', action: 'New user registered', user: 'John Doe', time: '2 minutes ago' },
          { type: 'post', action: 'New post published', user: 'Jane Smith', time: '5 minutes ago' },
          { type: 'comment', action: 'Comment flagged', user: 'Admin', time: '10 minutes ago' },
          { type: 'user', action: 'User role updated', user: 'Admin', time: '1 hour ago' },
        ]);
      } else {
        setError('Failed to load admin stats');
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      color: 'blue',
      href: '/admin/users'
    },
    {
      title: 'Post Management',
      description: 'Review, edit, and manage all posts',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
        </svg>
      ),
      color: 'green',
      href: '/admin/posts'
    },
    {
      title: 'Comment Moderation',
      description: 'Moderate comments and manage reports',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'purple',
      href: '/admin/comments'
    },
    {
      title: 'System Settings',
      description: 'Configure platform settings and preferences',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'gray',
      onClick: () => alert('System settings coming soon!')
    },
    {
      title: 'Analytics',
      description: 'View detailed platform analytics and reports',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'yellow',
      onClick: () => setActiveTab('analytics')
    },
    {
      title: 'Backup & Export',
      description: 'Backup data and export platform content',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      ),
      color: 'indigo',
      onClick: () => alert('Backup functionality coming soon!')
    }
  ];

  return (
    <AdminRoute>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your platform and monitor activity</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-8" aria-label="Tabs">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'analytics', name: 'Analytics' },
                { id: 'activity', name: 'Activity' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                  <button 
                    onClick={load} 
                    className="mt-2 text-red-600 dark:text-red-400 underline hover:text-red-800 dark:hover:text-red-200"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                      label="Total Users" 
                      value={stats?.overview?.users?.totalUsers || 0}
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                      }
                      color="blue"
                    />
                    <StatCard 
                      label="Active Users" 
                      value={stats?.overview?.users?.activeUsers || 0}
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      }
                      color="green"
                    />
                    <StatCard 
                      label="Total Posts" 
                      value={stats?.overview?.posts?.totalPosts || 0}
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                        </svg>
                      }
                      color="purple"
                    />
                    <StatCard 
                      label="Total Comments" 
                      value={stats?.overview?.comments?.totalComments || 0}
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      }
                      color="yellow"
                    />
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {quickActions.map((action, index) => (
                        <QuickActionCard key={index} {...action} />
                      ))}
                    </div>
                  </div>

                  {/* Top Authors */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Top Authors</h2>
                    {stats?.topAuthors?.length ? (
                      <div className="space-y-4">
                        {stats.topAuthors.slice(0, 5).map((author, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <img 
                                src={author.author?.avatarUrl || 'https://via.placeholder.com/40'} 
                                alt={author.author?.name} 
                                className="w-10 h-10 rounded-full"
                              />
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{author.author?.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {author.postCount} posts • {author.totalLikes} likes • {author.totalViews} views
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                #{idx + 1}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">No authors data available</div>
                    )}
                  </div>
                </>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Platform Analytics</h2>
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-lg">Advanced Analytics Coming Soon</p>
                    <p className="text-sm">Charts, graphs, and detailed insights will be available here.</p>
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h2>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                        <div className={`p-2 rounded-full ${
                          activity.type === 'user' ? 'bg-blue-100 dark:bg-blue-900' :
                          activity.type === 'post' ? 'bg-green-100 dark:bg-green-900' :
                          'bg-purple-100 dark:bg-purple-900'
                        }`}>
                          {activity.type === 'user' && (
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                          {activity.type === 'post' && (
                            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                            </svg>
                          )}
                          {activity.type === 'comment' && (
                            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{activity.action}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">by {activity.user} • {activity.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Layout>
    </AdminRoute>
  );
};

export default AdminDashboardPage;
