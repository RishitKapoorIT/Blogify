const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Upload image to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      folder: 'blogify',
      quality: 'auto:good',
      fetch_format: 'auto',
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      defaultOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

// Upload avatar image
const uploadAvatar = async (buffer, userId) => {
  try {
    const result = await uploadToCloudinary(buffer, {
      folder: 'blogify/avatars',
      public_id: `avatar_${userId}`,
      overwrite: true,
      width: 300,
      height: 300,
      crop: 'thumb',
      gravity: 'face'
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw new Error('Failed to upload avatar image');
  }
};

// Upload post cover image
const uploadCoverImage = async (buffer, postSlug) => {
  try {
    const result = await uploadToCloudinary(buffer, {
      folder: 'blogify/covers',
      public_id: `cover_${postSlug}_${Date.now()}`,
      width: 1200,
      height: 630,
      crop: 'fill',
      gravity: 'center'
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Cover image upload error:', error);
    throw new Error('Failed to upload cover image');
  }
};

// Upload post content image
const uploadContentImage = async (buffer) => {
  try {
    const result = await uploadToCloudinary(buffer, {
      folder: 'blogify/content',
      public_id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      width: 800,
      crop: 'limit'
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Content image upload error:', error);
    throw new Error('Failed to upload content image');
  }
};

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      result
    };
  } catch (error) {
    console.error('Image deletion error:', error);
    throw new Error('Failed to delete image');
  }
};

// Get optimized image URL
const getOptimizedImageUrl = (publicId, options = {}) => {
  const defaultOptions = {
    quality: 'auto:good',
    fetch_format: 'auto',
    ...options
  };

  return cloudinary.url(publicId, defaultOptions);
};

// Generate image variants for responsive design
const generateImageVariants = (publicId) => {
  const sizes = [
    { width: 400, suffix: 'sm' },
    { width: 800, suffix: 'md' },
    { width: 1200, suffix: 'lg' },
    { width: 1600, suffix: 'xl' }
  ];

  return sizes.reduce((variants, size) => {
    variants[size.suffix] = cloudinary.url(publicId, {
      width: size.width,
      quality: 'auto:good',
      fetch_format: 'auto'
    });
    return variants;
  }, {});
};

// Middleware for handling single image upload
const handleSingleImageUpload = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (error) => {
      if (error) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'File size too large. Maximum size is 5MB.'
          });
        }
        
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      next();
    });
  };
};

// Middleware for handling multiple image uploads
const handleMultipleImageUpload = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (error) => {
      if (error) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'File size too large. Maximum size is 5MB per file.'
          });
        }
        
        if (error.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            error: `Too many files. Maximum ${maxCount} files allowed.`
          });
        }
        
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      next();
    });
  };
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadAvatar,
  uploadCoverImage,
  uploadContentImage,
  deleteImage,
  getOptimizedImageUrl,
  generateImageVariants,
  handleSingleImageUpload,
  handleMultipleImageUpload
};