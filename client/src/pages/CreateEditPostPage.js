import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { createPost, updatePost, fetchPost } from '../features/posts/postsSlice';
import { usePosts, useAuth } from '../hooks';
import { validatePost, extractTextFromHtml } from '../utils';
import RichTextEditor from '../components/editor/RichTextEditor';
import Layout from '../components/layout/Layout';

const CreateEditPostPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { currentPost, isLoading } = usePosts();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    contentHtml: '',
    contentDelta: {},
    tags: '',
    coverImage: null,
    category: '',
    published: false,
    status: 'draft' // Add status field to match form
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = Boolean(slug);
  const [editingId, setEditingId] = useState(null); // actual _id used for PUT
  const authorId = currentPost?.author?._id || currentPost?.author?.id || (typeof currentPost?.author === 'string' ? currentPost.author : null);
  const userId = user?._id || user?.id;
  const isOwner = Boolean(isEditMode && authorId && userId && String(authorId) === String(userId));

  // Load existing post for editing
  useEffect(() => {
    if (isEditMode && slug) {
      dispatch(fetchPost(slug));
    }
  }, [dispatch, slug, isEditMode]);

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && currentPost) {
      setEditingId(currentPost._id);
      const status = currentPost.published ? 'published' : 'draft';
      setFormData({
        title: currentPost.title || '',
        excerpt: currentPost.excerpt || '',
        contentHtml: currentPost.contentHtml || '',
        contentDelta: (currentPost.contentDelta && Array.isArray(currentPost.contentDelta.ops))
          ? currentPost.contentDelta
          : { ops: [{ insert: `${extractTextFromHtml(currentPost.contentHtml || '')}\n` }] },
        tags: currentPost.tags?.join(', ') || '',
        coverImage: null,
        category: currentPost.category || '',
        published: !!currentPost.published,
        status: status
      });
      if (currentPost.coverImage) {
        setImagePreview(currentPost.coverImage);
      }
    }
  }, [isEditMode, currentPost]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Update published status when status changes
      published: name === 'status' ? value === 'published' : prev.published
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleContentChange = (content, delta) => {
    setFormData(prev => ({
      ...prev,
      contentHtml: content,
      contentDelta: delta || prev.contentDelta
    }));
    
    if (errors.contentHtml) {
      setErrors(prev => ({
        ...prev,
        contentHtml: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        coverImage: file
      }));
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      coverImage: null
    }));
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validatePost({ 
      title: formData.title, 
      contentHtml: formData.contentHtml, 
      excerpt: formData.excerpt 
    });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Debug logging
      console.log('Form data being submitted:', {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        contentHtml: formData.contentHtml.length + ' characters',
        contentDelta: formData.contentDelta,
        category: formData.category.trim(),
        published: String(formData.published),
        tags: formData.tags
      });

      // Prepare form data for submission
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('excerpt', formData.excerpt.trim());
      submitData.append('contentHtml', formData.contentHtml);
      // Ensure a valid Delta structure with ops array
      let submitDelta = (formData.contentDelta && Array.isArray(formData.contentDelta.ops))
        ? formData.contentDelta
        : null;
      if (!submitDelta) {
        const plain = extractTextFromHtml(formData.contentHtml || '');
        submitDelta = { ops: [{ insert: `${plain}\n` }] };
      }
      submitData.append('contentDelta', JSON.stringify(submitDelta));
      submitData.append('category', formData.category.trim());
      submitData.append('published', String(formData.published));
      
      // Process and sanitize tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      const cleanTags = tags.map(t => t.replace(/^#/, '').replace(/[^a-zA-Z0-9\s-]/g, '').toLowerCase()).filter(Boolean);
      
      // Add tags individually to FormData using tags[] to align backend parsing
      if (cleanTags.length > 0) {
        cleanTags.forEach(tag => submitData.append('tags[]', tag));
      }

      // Add image if provided
      if (formData.coverImage) {
        submitData.append('coverImage', formData.coverImage);
      }

      let result;
      if (isEditMode && editingId) {
        result = await dispatch(updatePost({ id: editingId, postData: submitData })).unwrap();
      } else {
        result = await dispatch(createPost(submitData)).unwrap();
      }

      // Navigate to the post
      const postSlug = result.slug || result.post?.slug;
      if (postSlug) {
        navigate(`/post/${postSlug}`);
      } else {
        // Fallback navigation
        navigate('/my-posts');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      const apiMsg = error?.response?.data?.error || error?.response?.data?.message;
      const details = error?.response?.data?.details?.map(d => d.message).join('\n');
      setErrors({ 
        submit: apiMsg || details || error.message || 'Failed to save post. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    // Set loading state
    setIsSubmitting(true);
    setErrors({});

    try {
      // Minimal validation for drafts - only title is required
      if (!formData.title || !formData.title.trim()) {
        setErrors({ title: 'Title is required even for drafts' });
        return;
      }

      const draftData = { ...formData, published: false, status: 'draft' };
      
      // Debug logging
      console.log('Saving draft:', {
        title: draftData.title.trim(),
        excerpt: draftData.excerpt,
        contentHtml: draftData.contentHtml.length + ' characters',
        contentDelta: draftData.contentDelta,
        category: draftData.category,
        published: false,
        tags: draftData.tags
      });

      // Prepare form data for submission
      const submitData = new FormData();
      submitData.append('title', draftData.title.trim());
      submitData.append('excerpt', draftData.excerpt || '');
      submitData.append('contentHtml', draftData.contentHtml || '<p><br></p>'); // Provide minimal content for drafts
      submitData.append('contentDelta', JSON.stringify(draftData.contentDelta || {"ops":[{"insert":"\n"}]}));
      submitData.append('category', draftData.category || '');
      submitData.append('published', 'false');
      
      // Process and sanitize tags
      const tags = draftData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      const cleanTags = tags.map(t => t.replace(/^#/, '').replace(/[^a-zA-Z0-9\s-]/g, '').toLowerCase()).filter(Boolean);
      
      // Add tags individually to FormData using tags[]
      if (cleanTags.length > 0) {
        cleanTags.forEach(tag => submitData.append('tags[]', tag));
      }

      // Add image if provided
      if (draftData.coverImage) {
        submitData.append('coverImage', draftData.coverImage);
      }

      let result;
      if (isEditMode && editingId) {
        result = await dispatch(updatePost({ id: editingId, postData: submitData })).unwrap();
      } else {
        result = await dispatch(createPost(submitData)).unwrap();
      }

      // Update form data to reflect saved state
      setFormData(prev => ({ ...prev, published: false, status: 'draft' }));

      // Show success message
      console.log('Draft saved successfully');

      // For new drafts, navigate to edit mode
      if (!isEditMode && result) {
        const postId = result._id || result.post?._id;
        if (postId) {
          const postSlug = result.slug || result.post?.slug;
          if (postSlug) {
            navigate(`/edit/${postSlug}`);
          } else {
            navigate('/my-posts');
          }
        } else {
          // Fallback navigation
          navigate('/my-posts');
        }
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setErrors({ 
        submit: error.message || 'Failed to save draft. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && isEditMode) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (isEditMode && currentPost && user && !isOwner) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">You can't edit this post</h2>
            <p className="text-red-600 dark:text-red-400">This post belongs to another user.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Post' : 'Create New Post'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isEditMode ? 'Update your post and reach your audience' : 'Share your story with the world'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display submission errors */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter your post title..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleInputChange}
              rows={3}
              placeholder="Brief description of your post (optional)..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cover Image
            </label>
            
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Featured"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="coverImage"
                />
                <label
                  htmlFor="coverImage"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-400">Click to upload featured image</span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG up to 10MB</span>
                </label>
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content *
            </label>
            <RichTextEditor
              value={formData.contentHtml}
              onChange={handleContentChange}
              placeholder="Write your post content..."
            />
            {errors.contentHtml && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contentHtml}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="Enter tags separated by commas (e.g., technology, tutorial, javascript)..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="submit"
              disabled={isSubmitting || (isEditMode && !isOwner)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEditMode ? 'Updating...' : 'Publishing...'}
                </span>
              ) : (
                isEditMode ? 'Update Post' : 'Publish Post'
              )}
            </button>
            
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting || (isEditMode && !isOwner)}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save as Draft'}
            </button>
            
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateEditPostPage;