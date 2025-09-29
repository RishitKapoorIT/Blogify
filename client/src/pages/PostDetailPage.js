import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchPost, toggleLike, deletePost, updatePost } from '../features/posts/postsSlice';
import { createComment, fetchComments } from '../features/comments/commentsSlice';
import { usePosts, useAuth, useComments } from '../hooks';
import { formatDate, formatReadingTime } from '../utils';
import usersAPI from '../api/users';
import Layout from '../components/layout/Layout';

const PostDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentPost, isLoading } = usePosts();
  const { comments, isLoading: commentsLoading } = useComments(currentPost?._id);
  const { isAuthenticated, user } = useAuth();

  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (slug) {
      dispatch(fetchPost(slug));
    }
  }, [dispatch, slug]);

  useEffect(() => {
    if (currentPost?._id) {
      dispatch(fetchComments({ postId: currentPost._id }));
    }
  }, [dispatch, currentPost?._id]);

  // Sync bookmark state when post changes
  useEffect(() => {
    setIsBookmarked(!!currentPost?.isBookmarked);
  }, [currentPost?.isBookmarked]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (currentPost) {
      await dispatch(toggleLike(currentPost._id));
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated) return;

    setIsSubmittingComment(true);
    try {
      await dispatch(createComment({
        postId: currentPost._id,
        commentData: { body: commentText.trim() }
      })).unwrap();
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!currentPost) return;
    
    setIsDeleting(true);
    try {
      await dispatch(deletePost(currentPost._id));
      navigate('/');
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!isAuthenticated || !isOwner || !currentPost) return;

    // Build FormData with existing post fields to satisfy server-side validation
    try {
      setIsPublishing(true);
      const formData = new FormData();
      formData.append('title', currentPost.title || '');
      if (currentPost.excerpt) formData.append('excerpt', currentPost.excerpt);
      formData.append('contentHtml', currentPost.contentHtml || '');
      const delta = currentPost.contentDelta || { ops: [] };
      formData.append('contentDelta', typeof delta === 'string' ? delta : JSON.stringify(delta));
      if (Array.isArray(currentPost.tags)) {
        currentPost.tags.forEach(tag => formData.append('tags[]', tag));
      }
      if (currentPost.category) formData.append('category', currentPost.category);
      formData.append('published', !currentPost.published);

      await dispatch(updatePost({ id: currentPost._id, postData: formData })).unwrap();
    } catch (error) {
      // Optionally show a toast; for now, log
      console.error('Failed to toggle publish state:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentPost) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Post not found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </Layout>
    );
  }

  // Only the post owner (not admins) should see owner controls on this page (robust id check)
  const authorId = currentPost?.author?._id || currentPost?.author?.id || (typeof currentPost?.author === 'string' ? currentPost.author : null);
  const userId = user?._id || user?.id;
  const isOwner = Boolean(isAuthenticated && authorId && userId && String(authorId) === String(userId));
  const isLiked = currentPost.isLiked;

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const { data } = await usersAPI.toggleBookmark(currentPost._id);
      const bookmarked = data?.data?.isBookmarked ?? !isBookmarked;
      setIsBookmarked(bookmarked);
    } catch (e) {
      // no-op toast for now
    }
  };

  return (
    <Layout>
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          {/* Featured Image */}
          {currentPost.coverImage && (
            <div className="mb-8">
              <img
                src={currentPost.coverImage}
                alt={currentPost.title}
                className="w-full h-64 sm:h-96 object-cover rounded-xl"
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {currentPost.title}
          </h1>

          {/* Excerpt */}
          {currentPost.excerpt && (
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              {currentPost.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              {/* Author */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {currentPost.author?.name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currentPost.author?.name}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>{formatDate(currentPost.createdAt)}</span>
                    <span>•</span>
                    <span>{formatReadingTime(currentPost.contentHtml)} read</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Like Button */}
              <button
                onClick={handleLike}
                disabled={!isAuthenticated}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isLiked
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900 dark:text-red-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
                title={!isAuthenticated ? 'Login to like' : ''}
              >
                <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{currentPost.likesCount || 0}</span>
              </button>

              {/* Bookmark Button */}
              <button
                onClick={handleBookmark}
                disabled={!isAuthenticated}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isBookmarked
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
                title={!isAuthenticated ? 'Login to save' : ''}
              >
                <svg className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3-7 3V5z" />
                </svg>
                <span>{isBookmarked ? 'Saved' : 'Save'}</span>
              </button>

              {/* Share Button */}
              <button
                onClick={() => navigator.share?.({ url: window.location.href, title: currentPost.title })}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span>Share</span>
              </button>

              {/* Owner Actions (author only) */}
              {isOwner && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleTogglePublish}
                    disabled={isPublishing}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPost.published
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-300'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                    title={currentPost.published ? 'Unpublish this post' : 'Publish this post'}
                  >
                    {isPublishing ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{currentPost.published ? 'Unpublish' : 'Publish'}</span>
                      </>
                    )}
                  </button>
                  <Link
                    to={`/edit/${currentPost.slug}`}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    title="Edit this post"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                    title="Delete this post"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {currentPost.tags && currentPost.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {currentPost.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Content */}
        <div className="prose prose-lg max-w-none dark:prose-invert mb-12">
          <div dangerouslySetInnerHTML={{ __html: currentPost.contentHtml }} />
        </div>

        {/* Comments Section */}
        <section className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Comments ({comments.length})
          </h3>

          {/* Comment Form */}
          {isAuthenticated ? (
            <form onSubmit={handleCommentSubmit} className="mb-8 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={!commentText.trim() || isSubmittingComment}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Join the discussion! Sign in to leave a comment.
              </p>
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Comments List */}
          {commentsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-6">
              {comments.map(comment => (
                <div key={comment._id} className="flex space-x-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {comment.author?.name?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-transparent">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {comment.author?.name}
                        </h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">
                        {comment.body}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No comments yet. Be the first to share your thoughts!
              </p>
            </div>
          )}
        </section>
      </article>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete Post
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleDeletePost}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PostDetailPage;