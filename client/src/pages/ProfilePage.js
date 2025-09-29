import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks';
import usersAPI from '../api/users';
import { formatDate } from '../utils';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalPosts: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [socialCounts, setSocialCounts] = useState({ followers: 0, following: 0 });

  const load = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      
      if (id) {
        // Viewing another user's profile
        response = await usersAPI.getUser(id, { page, limit: 10 });
      } else {
        // Viewing current user's profile - use auth API
        response = await usersAPI.getMyDashboard({ page, limit: 10 });
      }
      
      if (response.data?.success) {
        setProfile(response.data.data.user);
        setPosts(response.data.data.posts || []);
        setStats(response.data.data.stats || null);
        setPagination(response.data.data.pagination || { currentPage: page, totalPages: 1, totalPosts: (response.data.data.posts || []).length });
        // derive following state and counts if available
        if (response.data.data.user?.followersCount !== undefined || response.data.data.user?.followingCount !== undefined) {
          setSocialCounts({
            followers: response.data.data.user.followersCount || 0,
            following: response.data.data.user.followingCount || 0
          });
        }
      } else {
        setError('Failed to load profile');
      }
    } catch (e) {
      console.error('Profile load error:', e);
      setError(e?.response?.data?.error || e.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canFollow = currentUser && profile && currentUser._id !== profile.id;

  const handleFollowToggle = async () => {
    if (!canFollow) return;
    try {
      // Optimistic toggle
      setIsFollowing((prev) => !prev);
      setSocialCounts((c) => ({ ...c, followers: (c.followers || 0) + (isFollowing ? -1 : 1) }));
      if (isFollowing) {
        await usersAPI.unfollowUser(profile.id);
      } else {
        await usersAPI.followUser(profile.id);
      }
    } catch (e) {
      // Revert on error
      setIsFollowing((prev) => !prev);
      setSocialCounts((c) => ({ ...c, followers: (c.followers || 0) + (isFollowing ? 1 : -1) }));
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-gray-500">Loading profile…</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start gap-6">
              <img
                src={profile?.avatarUrl || 'https://via.placeholder.com/96'}
                alt={profile?.name}
                className="w-24 h-24 rounded-full object-cover"
                loading="lazy"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.name}</h1>
                <p className="text-gray-600 dark:text-gray-300">{profile?.bio || '—'}</p>
                <p className="text-sm text-gray-500 mt-2">Joined {formatDate(profile?.createdAt)}</p>
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                  <span><span className="font-semibold">{socialCounts.followers || 0}</span> Followers</span>
                  <span><span className="font-semibold">{socialCounts.following || 0}</span> Following</span>
                  {canFollow && (
                    <button
                      onClick={handleFollowToggle}
                      className={`ml-2 px-3 py-1 rounded border text-sm transition-colors ${isFollowing ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'}`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-500">Posts</div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalPosts || 0}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-500">Views</div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalViews || 0}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-500">Likes</div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalLikes || 0}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-500">Comments</div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalComments || 0}</div>
                </div>
              </div>
            )}

            {/* Posts */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Posts</h2>
              {posts.length === 0 ? (
                <p className="text-gray-500">No posts yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {posts.map((p) => (
                    <li key={p._id} className="py-4">
                      <a href={`/post/${p.slug}`} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">{p.title}</a>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(p.createdAt).toLocaleDateString()} • {p.likesCount} likes • {p.commentsCount} comments
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => load(page)}
                      className={`px-3 py-2 rounded border text-sm ${pagination.currentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage;
