import React from 'react';
import { Link } from 'react-router-dom';

const TrendingPostCard = ({ post, index }) => {
  return (
    <Link to={`/post/${post.slug}`} className="group">
      <article className="flex items-center space-x-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
        <div className="flex-shrink-0">
          <span className="text-2xl font-bold text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <img
              src={post.author?.avatarUrl || '/default-avatar.png'}
              alt={post.author?.name}
              className="w-5 h-5 rounded-full"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {post.author?.name}
            </span>
          </div>
          
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {post.title}
          </h3>
          
          <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {post.category}
            </span>
            <span>{post.readTime} min read</span>
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{post.likesCount}</span>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <img
            src={post.coverImage || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=100&h=100&fit=crop'}
            alt={post.title}
            className="w-16 h-16 object-cover rounded-lg"
          />
        </div>
      </article>
    </Link>
  );
};

export default TrendingPostCard;