import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toggleLike } from '../../features/posts/postsSlice';
import { useAuth, useToasts } from '../../hooks';
import { formatRelativeTime, truncateText, estimateReadingTime } from '../../utils';
import usersAPI from '../../api/users';

const PostCard = ({ post, showExcerpt = true, showActions = true }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToasts();
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      addToast({
        type: 'error',
        message: 'Please sign in to like posts'
      });
      return;
    }

    if (isLiking) return; // Prevent double clicks

    setIsLiking(true);
    try {
      await dispatch(toggleLike(post._id)).unwrap();
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to update like'
      });
    } finally {
      setIsLiking(false);
    }
  };

  const readingTime = post.readTime || estimateReadingTime(post.contentHtml || '');
  const [isBookmarked, setIsBookmarked] = useState(!!post.isBookmarked);
  const isOwner = user?._id === post.author?._id;

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      addToast({ type: 'error', message: 'Please sign in to save posts' });
      return;
    }

    if (isBookmarking) return; // Prevent double clicks

    setIsBookmarking(true);
    try {
      const { data } = await usersAPI.toggleBookmark(post._id);
      const bookmarked = data?.data?.isBookmarked ?? !isBookmarked;
      setIsBookmarked(bookmarked);
      addToast({ type: 'success', message: bookmarked ? 'Saved to reading list' : 'Removed from reading list' });
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to update reading list' });
    } finally {
      setIsBookmarking(false);
    }
  };

  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] group">
      {/* Featured Image */}
      {post.coverImage && (
        <div className="aspect-w-16 aspect-h-9 rounded-t-lg overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-6">
        {/* Author and Meta Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Link
              to={`/profile/${post.author?._id || ''}`}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <img
                src={post.author?.avatarUrl || '/default-avatar.png'}
                alt={post.author?.name || ''}
                className="w-10 h-10 rounded-full object-cover mr-3"
                loading="lazy"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {post.author?.name || ''}
                </p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>{formatRelativeTime(post.createdAt)}</span>
                  {readingTime > 0 && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{readingTime} min read</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          </div>

          {/* Post Status */}
          <div className="flex items-center space-x-2">
            {post.status === 'draft' && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                Draft
              </span>
            )}
            {post.featured && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                Featured
              </span>
            )}
          </div>
        </div>

        {/* Title and Content */}
        <div className="mb-4">
          <Link to={`/post/${post.slug}`} className="group">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-3 leading-tight">
              {post.title}
            </h2>
          </Link>

          {showExcerpt && post.excerpt && (
            <p className="text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed mb-2">
              {truncateText(post.excerpt, 150)}
            </p>
          )}
          {post.category && (
            <span className="inline-block px-3 py-1 text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300 rounded-full">
              {post.category}
            </span>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                to={`/?tag=${encodeURIComponent(tag)}`}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                #{tag}
              </Link>
            ))}
            {post.tags.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-400 dark:text-gray-500">
                +{post.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              {/* Like Button */}
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform active:scale-95 ${
                  post.isLiked
                    ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-600 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-400 shadow-lg'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-500 dark:hover:text-red-400'
                } ${isLiking ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-md'}`}
                title={post.isLiked ? 'Unlike this post' : 'Like this post'}
              >
                {isLiking ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    className={`w-4 h-4 transition-all duration-200 ${
                      post.isLiked 
                        ? 'fill-current text-red-500 transform scale-110' 
                        : 'stroke-current hover:fill-red-200 dark:hover:fill-red-800'
                    }`}
                    fill={post.isLiked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={post.isLiked ? 0 : 2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                )}
                <span className="font-semibold">{post.likesCount || 0}</span>
              </button>

              {/* Comments Count */}
              <Link
                to={`/post/${post.slug}#comments`}
                className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:shadow-md transform active:scale-95"
                title="View comments"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span className="font-semibold">{post.commentsCount || 0}</span>
              </Link>

              {/* Bookmark Button */}
              <button
                onClick={handleBookmark}
                disabled={isBookmarking}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform active:scale-95 ${
                  isBookmarked
                    ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 dark:from-amber-900/30 dark:to-yellow-900/30 dark:text-amber-400 shadow-lg'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 hover:text-amber-600 dark:hover:text-amber-400'
                } ${isBookmarking ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-md'}`}
                title={isBookmarked ? 'Remove from reading list' : 'Save to reading list'}
              >
                {isBookmarking ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    className={`w-4 h-4 transition-all duration-200 ${
                      isBookmarked 
                        ? 'fill-current text-amber-600 transform scale-110' 
                        : 'stroke-current hover:fill-amber-200 dark:hover:fill-amber-800'
                    }`}
                    fill={isBookmarked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={isBookmarked ? 0 : 2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3-7 3V5z"
                    />
                  </svg>
                )}
                <span className="font-semibold">{isBookmarked ? 'Saved' : 'Save'}</span>
              </button>

              {/* Share Button */}
              <button
                onClick={() => {
                  const url = `${window.location.origin}/post/${post.slug}`;
                  if (navigator.share) {
                    navigator.share({
                      title: post.title,
                      text: post.excerpt,
                      url: url
                    });
                  } else {
                    navigator.clipboard.writeText(url);
                    addToast({
                      type: 'success',
                      message: 'Link copied to clipboard'
                    });
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/10 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 hover:shadow-md transform active:scale-95"
                title="Share this post"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
                <span className="font-semibold">Share</span>
              </button>
            </div>

            {/* Edit/Delete for Post Owner */}
            {isOwner && (
              <div className="flex items-center space-x-2">
                <Link
                  to={`/edit/${post._id}`}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Edit post"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default PostCard;