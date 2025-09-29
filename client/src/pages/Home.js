import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchTrendingPosts } from '../features/posts/postsSlice';
import { usePosts, useAuth } from '../hooks';
import PostCard from '../components/posts/PostCard';
import FeaturedPostCard from '../components/posts/FeaturedPostCard';
import TrendingPostCard from '../components/posts/TrendingPostCard';
import PostFilters from '../components/posts/PostFilters';
import Layout from '../components/layout/Layout';

// Sample featured posts (when no real posts exist)
const samplePosts = [
  {
    _id: 'sample-1',
    title: 'The Future of Web Development: Trends to Watch in 2025',
    slug: 'future-web-development-trends-2025',
    excerpt: 'Explore the cutting-edge technologies and methodologies that are shaping the future of web development, from AI integration to sustainable coding practices.',
    author: {
      _id: 'author-1',
      name: 'Sarah Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612e923?w=150&h=150&fit=crop&crop=face'
    },
    category: 'Technology',
    tags: ['webdev', 'future', 'trends'],
    likesCount: 142,
    commentsCount: 23,
    readTime: 8,
    createdAt: '2024-09-15T10:00:00.000Z',
    coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop',
    isLiked: false,
    published: true,
    featured: true
  },
  {
    _id: 'sample-2',
    title: 'Building Scalable React Applications: Lessons from Production',
    slug: 'scalable-react-applications-production',
    excerpt: 'Real-world insights and proven strategies for building React applications that can handle millions of users while maintaining performance and code quality.',
    author: {
      _id: 'author-2',
      name: 'Alex Rodriguez',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    category: 'Engineering',
    tags: ['react', 'scalability', 'performance'],
    likesCount: 89,
    commentsCount: 15,
    readTime: 12,
    createdAt: '2024-09-14T14:30:00.000Z',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop',
    isLiked: false,
    published: true
  },
  {
    _id: 'sample-3',
    title: 'The Art of Technical Writing: Making Complex Ideas Accessible',
    slug: 'art-technical-writing-accessible',
    excerpt: 'How to communicate complex technical concepts clearly and effectively, with practical tips from experienced technical writers and developers.',
    author: {
      _id: 'author-3',
      name: 'Maya Patel',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    category: 'Writing',
    tags: ['writing', 'communication', 'documentation'],
    likesCount: 156,
    commentsCount: 31,
    readTime: 6,
    createdAt: '2024-09-13T09:15:00.000Z',
    coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=400&fit=crop',
    isLiked: false,
    published: true
  }
];

const topicCategories = [
  { name: 'Technology', icon: '💻', count: '2.5k' },
  { name: 'Design', icon: '🎨', count: '1.8k' },
  { name: 'Business', icon: '💼', count: '3.2k' },
  { name: 'Health', icon: '⚕️', count: '1.1k' },
  { name: 'Science', icon: '🔬', count: '956' },
  { name: 'Culture', icon: '🎭', count: '2.1k' },
  { name: 'Politics', icon: '🏛️', count: '1.7k' },
  { name: 'Sports', icon: '⚽', count: '890' }
];

const staffPicks = [
  {
    title: 'How I Built a Startup That Failed (And What I Learned)',
    author: 'Jennifer Liu',
    readTime: 15,
    category: 'Entrepreneurship'
  },
  {
    title: 'The Psychology Behind Great User Interface Design',
    author: 'David Kim',
    readTime: 9,
    category: 'Design'
  },
  {
    title: 'Why Remote Work Is Here to Stay: Data from 500 Companies',
    author: 'Rachel Green',
    readTime: 7,
    category: 'Future of Work'
  }
];

const Home = () => {
  const dispatch = useDispatch();
  const { posts, trendingPosts, isLoading, pagination } = usePosts();
  const { isAuthenticated } = useAuth();
  const [showSampleData, setShowSampleData] = useState(false);

  useEffect(() => {
    // Let PostFilters initialize the main posts list from URL params to avoid double-fetch
    // Only fetch trending posts here
    dispatch(fetchTrendingPosts({ limit: 5 }));
    
    // Show sample data if no real posts exist after loading
    if (!isLoading && posts.length === 0) {
      setShowSampleData(true);
    } else {
      setShowSampleData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts.length, isLoading]);

  const displayPosts = showSampleData ? samplePosts : posts;

  if (isLoading && posts.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Medium-style Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-8 mb-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 leading-tight">
              Welcome to Blogify
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover amazing stories, share your thoughts, and connect with writers from around the world.
            </p>
            
            {!isAuthenticated ? (
              <div className="flex justify-center space-x-4">
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  Start Writing
                </Link>
                <Link
                  to="/login"
                  className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <Link
                to="/create"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Write a Story
              </Link>
            )}
          </div>
        </div>

        {/* Featured Content Section */}
        {displayPosts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Stories</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">Editor's picks</span>
            </div>
            
            {/* Featured Post Card - Large */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              <div className="lg:col-span-1">
                <FeaturedPostCard post={displayPosts[0]} />
              </div>
              
              {/* Trending Topics */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Trending Topics</h3>
                <div className="grid grid-cols-2 gap-3">
                  {topicCategories.slice(0, 8).map((topic, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{topic.icon}</span>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{topic.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{topic.count} stories</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Posts Section Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Latest Stories</h2>
              {showSampleData && (
                <span className="text-sm bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 px-3 py-1 rounded-full">
                  Demo Content
                </span>
              )}
            </div>
            
            {/* Filters */}
            <PostFilters />

            {/* Posts Grid */}
            <div className="space-y-8 mt-8">
              {displayPosts.length > 0 ? (
                displayPosts.map(post => (
                  <PostCard key={post._id} post={post} />
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                    No stories published yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Be the first to share your story with the community!
                  </p>
                  {isAuthenticated && (
                    <Link
                      to="/create"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      Write Your First Story
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Staff Picks */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-lg">⭐</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Staff Picks
                </h3>
              </div>
              <div className="space-y-4">
                {staffPicks.map((pick, index) => (
                  <div key={index} className="group cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {pick.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{pick.author}</span>
                          <span>•</span>
                          <span>{pick.readTime} min read</span>
                        </div>
                        <span className="inline-block mt-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 rounded-full">
                          {pick.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Authors */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-lg">📈</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Trending Authors
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Sarah Chen', followers: '12.5k', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612e923?w=50&h=50&fit=crop&crop=face' },
                  { name: 'Alex Rodriguez', followers: '8.2k', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face' },
                  { name: 'Maya Patel', followers: '15.1k', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face' },
                  { name: 'David Kim', followers: '6.8k', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face' }
                ].map((author, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <img
                      src={author.avatar}
                      alt={author.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">{author.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{author.followers} followers</p>
                    </div>
                    <button className="text-blue-600 dark:text-blue-400 text-xs font-medium hover:text-blue-700 dark:hover:text-blue-300">
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Trending Posts */}
            {(trendingPosts.length > 0 || showSampleData) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-lg">🔥</span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Trending
                  </h3>
                </div>
                <div className="space-y-2">
                  {(trendingPosts.length > 0 ? trendingPosts : samplePosts).slice(0, 5).map((post, index) => (
                    <TrendingPostCard key={post._id} post={post} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Community Stats */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-lg">📊</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Community
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Stories</span>
                  <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                    {showSampleData ? '3' : (pagination.totalPosts || '0')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Active Writers</span>
                  <span className="font-bold text-xl text-green-600 dark:text-green-400">
                    1,234
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">This Month</span>
                  <span className="font-bold text-xl text-purple-600 dark:text-purple-400">
                    156
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-center">
                    {!isAuthenticated ? (
                      <Link
                        to="/register"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        Join the Community
                      </Link>
                    ) : (
                      <Link
                        to="/create"
                        className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        Share Your Story
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;