// Date utilities
export const formatDate = (dateString, options = {}) => {
  const date = new Date(dateString);
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return formatDate(dateString, { hour: undefined, minute: undefined });
};

export const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
};

// String utilities
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + suffix;
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const slugify = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

export const extractTextFromHtml = (html) => {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

export const countWords = (text) => {
  if (!text) return 0;
  const plainText = extractTextFromHtml(text);
  return plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export const estimateReadingTime = (text, wordsPerMinute = 200) => {
  const wordCount = countWords(text);
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes;
};

// Array utilities
export const removeDuplicates = (array, key = null) => {
  if (!Array.isArray(array)) return [];
  
  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }
  
  return [...new Set(array)];
};

export const sortByDate = (array, dateField = 'createdAt', order = 'desc') => {
  if (!Array.isArray(array)) return [];
  
  return [...array].sort((a, b) => {
    const dateA = new Date(a[dateField]);
    const dateB = new Date(b[dateField]);
    
    if (order === 'asc') {
      return dateA - dateB;
    }
    return dateB - dateA;
  });
};

export const groupByDate = (array, dateField = 'createdAt') => {
  if (!Array.isArray(array)) return {};
  
  return array.reduce((groups, item) => {
    const date = new Date(item[dateField]).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});
};

// Validation utilities
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
};

export const validatePasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  let strength = 'weak';
  
  if (score >= 4) strength = 'strong';
  else if (score >= 3) strength = 'medium';
  
  return { checks, score, strength };
};

export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// File utilities
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

export const isImageFile = (file) => {
  if (!file) return false;
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return imageTypes.includes(file.type);
};

// URL utilities
export const getQueryParams = (url = window.location.search) => {
  return Object.fromEntries(new URLSearchParams(url));
};

export const buildUrl = (baseUrl, params = {}) => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
};

export const removeQueryParams = (url, paramsToRemove = []) => {
  const urlObj = new URL(url);
  paramsToRemove.forEach(param => {
    urlObj.searchParams.delete(param);
  });
  return urlObj.toString();
};

// Local storage utilities
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// Theme utilities
export const applyTheme = (theme) => {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#1f2937' : '#ffffff');
  }
};

export const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Error utilities
export const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return defaultMessage;
};

export const isNetworkError = (error) => {
  return error?.code === 'NETWORK_ERROR' || error?.message === 'Network Error';
};

// Debounce utility
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle utility
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Social share utilities
export const getShareUrl = (platform, url, title = '', text = '') => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(text);
  
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%20${encodedUrl}`
  };
  
  return shareUrls[platform] || url;
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  } catch (error) {
    console.error('Failed to copy text: ', error);
    return false;
  }
};

// Form validation utilities
export const validatePost = (formData) => {
  const errors = {};
  
  // Title validation
  if (!formData.title || !formData.title.trim()) {
    errors.title = 'Title is required';
  } else if (formData.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters';
  } else if (formData.title.trim().length > 200) {
    errors.title = 'Title must be less than 200 characters';
  }
  
  // Content validation - check both contentHtml and content for backwards compatibility
  const contentToValidate = formData.contentHtml || formData.content;
  if (!contentToValidate || !contentToValidate.trim()) {
    errors.contentHtml = 'Content is required';
  } else {
    const plainTextContent = extractTextFromHtml(contentToValidate);
    if (plainTextContent.trim().length < 10) {
      errors.contentHtml = 'Content must be at least 10 characters';
    }
  }
  
  // Excerpt validation (optional but if provided should meet criteria)
  if (formData.excerpt && formData.excerpt.length > 500) {
    errors.excerpt = 'Excerpt must be less than 500 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateComment = (content) => {
  const errors = {};
  
  if (!content || !content.trim()) {
    errors.content = 'Comment cannot be empty';
  } else if (content.trim().length < 3) {
    errors.content = 'Comment must be at least 3 characters';
  } else if (content.trim().length > 1000) {
    errors.content = 'Comment must be less than 1000 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateLogin = (formData) => {
  const errors = {};
  
  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!formData.password) {
    errors.password = 'Password is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateRegister = (formData) => {
  const errors = {};
  
  // First name validation
  if (!formData.firstName || !formData.firstName.trim()) {
    errors.firstName = 'First name is required';
  } else if (formData.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }
  
  // Last name validation
  if (!formData.lastName || !formData.lastName.trim()) {
    errors.lastName = 'Last name is required';
  } else if (formData.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
  }
  
  // Email validation
  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (!isStrongPassword(formData.password)) {
    errors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
  }
  
  // Confirm password validation
  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Reading time utility
export const formatReadingTime = (content) => {
  const readingTime = estimateReadingTime(content);
  return readingTime === 1 ? '1 min' : `${readingTime} mins`;
};

const utils = {
  formatDate,
  formatRelativeTime,
  getTimeAgo,
  truncateText,
  capitalize,
  slugify,
  extractTextFromHtml,
  countWords,
  estimateReadingTime,
  removeDuplicates,
  sortByDate,
  groupByDate,
  isValidEmail,
  isStrongPassword,
  validatePasswordStrength,
  isValidUrl,
  formatFileSize,
  getFileExtension,
  isImageFile,
  getQueryParams,
  buildUrl,
  removeQueryParams,
  getFromStorage,
  setToStorage,
  removeFromStorage,
  applyTheme,
  getSystemTheme,
  getErrorMessage,
  isNetworkError,
  debounce,
  throttle,
  getShareUrl,
  copyToClipboard,
  validatePost,
  validateComment,
  validateLogin,
  validateRegister,
  formatReadingTime
};

export default utils;