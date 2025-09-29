import React from 'react';
import { Link } from 'react-router-dom';

const FeaturedPostCard = ({ post }) => {
  return (
    <article className="relative overflow-hidden rounded-2xl shadow-2xl group cursor-pointer">
      <Link to={`/post/${post.slug}`}>
        <div className="relative h-80">
          <img
            src={post.coverImage || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop'}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={post.author?.avatarUrl || '/default-avatar.png'}
                  alt={post.author?.name}
                  className="w-12 h-12 rounded-full border-2 border-white/20"
                />
                <div>
                  <p className="text-white font-medium">{post.author?.name}</p>
                  <p className="text-gray-300 text-sm">
                    {new Date(post.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              
              <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full mb-4">
                {post.category}
              </span>
              
              <h2 className="text-3xl font-bold text-white mb-3 leading-tight group-hover:text-blue-200 transition-colors">
                {post.title}
              </h2>
              
              <p className="text-gray-200 text-base mb-4 line-clamp-2">
                {post.excerpt}
              </p>
              
              <div className="flex items-center space-x-6 text-gray-300 text-sm">
                <span>{post.readTime} min read</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{post.likesCount}</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{post.commentsCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default FeaturedPostCard;