module.exports = {
  production: {
    // Database
    mongoUri: process.env.MONGO_URI,
    mongoDbName: process.env.MONGO_DB_NAME || 'blogify_production',
    
    // JWT
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtExpiresIn: '15m',
    jwtRefreshExpiresIn: '7d',
    
    // Security
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    corsOrigin: process.env.CLIENT_ORIGIN,
    
    // Rate Limiting
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    
    // File Upload
    maxFileSize: 10 * 1024 * 1024, // 10MB
    
    // Cloudinary
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    
    // Monitoring
    sentryDsn: process.env.SENTRY_DSN,
    
    // Email
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  },
  
  development: {
    mongoUri: process.env.MONGO_URI,
    mongoDbName: process.env.MONGO_DB_NAME || 'blogify_dev',
    jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret',
    jwtExpiresIn: '15m',
    jwtRefreshExpiresIn: '7d',
    bcryptRounds: 10,
    corsOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    rateLimitWindowMs: 15 * 60 * 1000,
    rateLimitMaxRequests: 1000, // More lenient for development
    maxFileSize: 10 * 1024 * 1024,
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
  },
  
  test: {
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/blogify_test',
    mongoDbName: process.env.MONGO_DB_NAME || 'blogify_test',
    jwtSecret: 'test_jwt_secret',
    jwtRefreshSecret: 'test_jwt_refresh_secret',
    jwtExpiresIn: '15m',
    jwtRefreshExpiresIn: '7d',
    bcryptRounds: 1, // Faster for tests
    corsOrigin: 'http://localhost:3000',
    rateLimitWindowMs: 15 * 60 * 1000,
    rateLimitMaxRequests: 10000, // Very lenient for tests
    maxFileSize: 5 * 1024 * 1024,
  }
};