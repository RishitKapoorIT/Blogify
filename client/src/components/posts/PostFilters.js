import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchPosts, setFilters, resetFilters } from '../../features/posts/postsSlice';
import { usePosts } from '../../hooks';
import { useSearchParams } from 'react-router-dom';

const PostFilters = () => {
  const dispatch = useDispatch();
  const { filters, pagination } = usePosts();

  const [localFilters, setLocalFilters] = useState({
    category: filters.category || '',
    tags: filters.tags || [],
    sortBy: filters.sortBy || 'createdAt',
    sortOrder: filters.sortOrder || 'desc'
  });

  const [tagInput, setTagInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const debounceRef = useRef();
  const lastFetchKeyRef = useRef('');

  const safeDispatchFetch = (params) => {
    // Normalize params to a stable key to prevent redundant fetches
    const cleaned = { ...params };
    Object.keys(cleaned).forEach((k) => {
      if (cleaned[k] === '' || cleaned[k] === undefined || cleaned[k] === null) delete cleaned[k];
    });
    // Ensure stable order
    const key = JSON.stringify(Object.keys(cleaned).sort().reduce((acc, k) => { acc[k] = cleaned[k]; return acc; }, {}));
    if (key !== lastFetchKeyRef.current) {
      lastFetchKeyRef.current = key;
      dispatch(fetchPosts(cleaned));
    }
  };

  // Initialize from URL params on mount
  useEffect(() => {
    const p = Object.fromEntries(searchParams.entries());
    const initial = {
      category: p.category || '',
      tags: p.tags ? p.tags.split(',').filter(Boolean) : [],
      sortBy: p.sortBy || 'createdAt',
      sortOrder: p.sortOrder || 'desc'
    };
    setLocalFilters(initial);
    setSearch(p.search || '');
    const page = parseInt(p.page || '1', 10);
  dispatch(setFilters(initial));
  safeDispatchFetch({ ...initial, search: p.search || '', page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = [
    'Technology',
    'Lifestyle',
    'Travel',
    'Food',
    'Fashion',
    'Health',
    'Business',
    'Education',
    'Entertainment',
    'Sports'
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'updatedAt', label: 'Last Updated' },
    { value: 'likesCount', label: 'Most Liked' },
    { value: 'commentsCount', label: 'Most Commented' },
    { value: 'title', label: 'Title (A-Z)' }
  ];

  const handleFilterChange = (key, value) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    
    // Apply filters immediately
    dispatch(setFilters(updatedFilters));
    const params = {
      ...Object.fromEntries(searchParams.entries()),
      category: updatedFilters.category || '',
      tags: (updatedFilters.tags || []).join(','),
      sortBy: updatedFilters.sortBy,
      sortOrder: updatedFilters.sortOrder,
      search,
      page: '1'
    };
    // Clean empty
    if (!params.category) delete params.category;
    if (!params.tags) delete params.tags;
    if (!params.search) delete params.search;
  setSearchParams(params);
  safeDispatchFetch({ ...updatedFilters, search, page: 1 });
  };

  const handleTagAdd = (tag) => {
    if (tag && !localFilters.tags.includes(tag)) {
      const updatedTags = [...localFilters.tags, tag];
      handleFilterChange('tags', updatedTags);
    }
    setTagInput('');
  };

  const handleTagRemove = (tagToRemove) => {
    const updatedTags = localFilters.tags.filter(tag => tag !== tagToRemove);
    handleFilterChange('tags', updatedTags);
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleTagAdd(tagInput.trim());
    }
  };

  const handleReset = () => {
    setLocalFilters({
      category: '',
      tags: [],
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setSearch('');
    dispatch(resetFilters());
  setSearchParams({});
  safeDispatchFetch({ page: 1 });
  };

  const hasActiveFilters = 
    localFilters.category || 
    localFilters.tags.length > 0 || 
    localFilters.sortBy !== 'createdAt' || 
    localFilters.sortOrder !== 'desc';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Posts</h3>
          <div className="mt-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  const params = {
                    category: localFilters.category || '',
                    tags: (localFilters.tags || []).join(','),
                    sortBy: localFilters.sortBy,
                    sortOrder: localFilters.sortOrder,
                    search,
                    page: '1'
                  };
                  if (!params.category) delete params.category;
                  if (!params.tags) delete params.tags;
                  if (!params.search) delete params.search;
                  setSearchParams(params);
                  safeDispatchFetch({ page: 1, search, ...localFilters });
                }
              }}
              placeholder="Search posts by title, content, or tags"
              className="w-full md:max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showAdvanced ? 'Simple' : 'Advanced'} Filters
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            value={localFilters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sort By
          </label>
          <select
            value={localFilters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Order
          </label>
          <select
            value={localFilters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>

        {/* Quick Actions */}
        <div className="flex items-end">
          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={() => {
                handleFilterChange('sortBy', 'likesCount');
                handleFilterChange('sortOrder', 'desc');
              }}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                localFilters.sortBy === 'likesCount' && localFilters.sortOrder === 'desc'
                  ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Popular
            </button>
            <button
              onClick={() => {
                handleFilterChange('sortBy', 'createdAt');
                handleFilterChange('sortOrder', 'desc');
              }}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                localFilters.sortBy === 'createdAt' && localFilters.sortOrder === 'desc'
                  ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Recent
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tags Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  placeholder="Add tags (press Enter or comma to add)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                {localFilters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {localFilters.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                      >
                        #{tag}
                        <button
                          onClick={() => handleTagRemove(tag)}
                          className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  placeholder="From"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="date"
                  placeholder="To"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
              
              {localFilters.category && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  Category: {localFilters.category}
                </span>
              )}
              
              {localFilters.tags.map(tag => (
                <span key={tag} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                  #{tag}
                </span>
              ))}
              
              {(localFilters.sortBy !== 'createdAt' || localFilters.sortOrder !== 'desc') && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  Sort: {sortOptions.find(opt => opt.value === localFilters.sortBy)?.label} ({localFilters.sortOrder === 'desc' ? 'Newest' : 'Oldest'})
                </span>
              )}
            </div>
            
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {pagination.totalPosts} post{pagination.totalPosts !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostFilters;