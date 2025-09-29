const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('=== VALIDATION ERRORS ===');
    console.log('Request body:', req.body);
    console.log('Validation errors:', errors.array());
    console.log('========================');
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// User registration validation
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    // Allow letters (incl. unicode), spaces, apostrophes and hyphens
    .matches(/^[\p{L}\s'-]+$/u)
    .withMessage('Name must contain only letters, spaces, apostrophes, and hyphens'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email cannot exceed 100 characters'),
  
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Post creation/update validation
const validatePost = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Excerpt cannot exceed 500 characters'),
  
  body('contentDelta')
    .custom((value, { req }) => {
      // For drafts, be more lenient with content validation
      const isDraft = req.body.published === 'false' || req.body.published === false;
      
      // Handle both string (FormData) and object formats
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (typeof parsed !== 'object' || !parsed.ops || !Array.isArray(parsed.ops)) {
            throw new Error('Invalid Delta format');
          }
          
          // For published posts, check if delta has actual content
          if (!isDraft) {
            const hasContent = parsed.ops.some(op => 
              op.insert && typeof op.insert === 'string' && op.insert.trim().length > 0
            );
            if (!hasContent) {
              throw new Error('Content is required for published posts');
            }
          }
          return true;
        } catch (error) {
          throw new Error(error.message || 'Content must be a valid Delta object');
        }
      } else if (typeof value === 'object' && value.ops && Array.isArray(value.ops)) {
        // For published posts, check if delta has actual content
        if (!isDraft) {
          const hasContent = value.ops.some(op => 
            op.insert && typeof op.insert === 'string' && op.insert.trim().length > 0
          );
          if (!hasContent) {
            throw new Error('Content is required for published posts');
          }
        }
        return true;
      } else {
        throw new Error('Content must be a valid Delta object');
      }
    }),
  
  body('contentHtml')
    .custom((value, { req }) => {
      // For drafts, be more lenient with content validation
      const isDraft = req.body.published === 'false' || req.body.published === false;
      
      if (!value) {
        if (isDraft) {
          return true; // Allow empty content for drafts
        } else {
          throw new Error('Content HTML is required for published posts');
        }
      }
      
      if (typeof value !== 'string') {
        throw new Error('Content HTML must be a string');
      }
      
      if (!isDraft) {
        // For published posts, ensure minimum content length
        if (value.length < 10) {
          throw new Error('Content must be at least 10 characters for published posts');
        }
        if (value.length > 50000) {
          throw new Error('Content cannot exceed 50000 characters');
        }
      } else {
        // For drafts, only check maximum length
        if (value.length > 50000) {
          throw new Error('Content cannot exceed 50000 characters');
        }
      }
      
      return true;
    }),
  
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters')
    .matches(/^[a-zA-Z0-9\s-]+$/)
    .withMessage('Tags can only contain letters, numbers, spaces, and hyphens'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
  
  body('published')
    .optional()
    .custom((value) => {
      // Handle both boolean and string formats (from FormData)
      if (typeof value === 'boolean' || value === 'true' || value === 'false') {
        return true;
      }
      throw new Error('Published must be a boolean value');
    }),
  
  body('coverImage')
    .optional()
    .isURL()
    .withMessage('Cover image must be a valid URL'),
  
  handleValidationErrors
];

// Comment creation validation
const validateComment = [
  body('body')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
    .escape(), // Escape HTML entities
  
  body('parent')
    .optional()
    .isMongoId()
    .withMessage('Parent must be a valid comment ID'),
  
  handleValidationErrors
];

// User profile update validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name must contain only letters and spaces'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('Avatar URL must be a valid URL'),
  
  handleValidationErrors
];

// Search query validation
const validateSearchQuery = [
  body('query')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  body('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'title', '-title', 'likesCount', '-likesCount'])
    .withMessage('Invalid sort parameter'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
  
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed for filtering'),
  
  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (field) => [
  body(field)
    .isMongoId()
    .withMessage(`${field} must be a valid MongoDB ObjectId`),
  
  handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('New password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Role update validation (admin only)
const validateRoleUpdate = [
  body('role')
    .isIn(['user', 'admin'])
    .withMessage('Role must be either "user" or "admin"'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validatePost,
  validateComment,
  validateProfileUpdate,
  validateSearchQuery,
  validateObjectId,
  validatePasswordChange,
  validateRoleUpdate
};