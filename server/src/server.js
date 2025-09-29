require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

const clientOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://localhost:3001,http://localhost:3000').split(',');

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ 
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (clientOrigins.indexOf(origin) === -1) {
      console.warn(`[CORS] Rejected request from origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
    console.log(`[CORS] Allowed request from origin: ${origin}`);
    return callback(null, true);
  },
  credentials: true 
}));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/users', require('../routes/users'));
app.use('/api/posts', require('../routes/posts'));
app.use('/api/comments', require('../routes/comments'));
app.use('/api/admin', require('../routes/admin'));

// Serve static files from React build (production)
const clientBuildPath = path.resolve(__dirname, '../../client/build');
app.use(express.static(clientBuildPath));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'blogify-server' });
});

// Serve React app for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// 404 handler
app.use((req, res, _next) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Error]', err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
