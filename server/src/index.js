const http = require('http');
const mongoose = require('mongoose');
const app = require('./server');
const { connectToDatabase } = require('./lib/db');

const PORT = process.env.PORT || 3001;
let server;

async function startServer() {
  server = http.createServer(app);
  return new Promise((resolve, reject) => {
    server.listen(PORT, () => {
      console.log(`[Server] Listening on http://localhost:${PORT}`);
      resolve();
    }).on('error', reject);
  });
}

async function start() {
  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME || 'blogify';

  if (!mongoUri) {
    console.error('[DB] MONGO_URI not set in environment variables.');
    process.exit(1);
  }

  try {
    // Connect to MongoDB first
    console.log('[DB] Connecting to MongoDB...');
    await connectToDatabase(mongoUri, dbName);
    console.log(`[DB] Connected successfully to "${dbName}" database`);

    // List collections and check users
    const collections = await mongoose.connection.db.collections();
    console.log('[DB] Collections:', collections.map(c => c.collectionName).join(', '));

    const User = require('../models/User');
    const usersCount = await User.countDocuments();
    console.log(`[DB] Found ${usersCount} users in database`);

    // Start the server after DB connection is established
    await startServer();

    // Set up error handlers
    mongoose.connection.on('error', err => {
      console.error('[DB] MongoDB error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] MongoDB disconnected. Attempting to reconnect...');
    });

    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('[DB] MongoDB connection closed through app termination');
        server.close(() => {
          console.log('[Server] HTTP server closed');
          process.exit(0);
        });
      } catch (err) {
        console.error('[DB] Error during graceful shutdown:', err);
        process.exit(1);
      }
    });

  } catch (err) {
    console.error('[DB] Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}

start().catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
