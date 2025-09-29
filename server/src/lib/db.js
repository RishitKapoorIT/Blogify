const mongoose = require('mongoose');

async function connectToDatabase(uri, dbName) {
  console.log('[DB] Connecting to MongoDB...');
  console.log('[DB] Database:', dbName);
  
  mongoose.set('strictQuery', true);
  const opts = {
    dbName,
    autoIndex: true,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
  };

  try {
    await mongoose.connect(uri, opts);
    console.log('[DB] Connected successfully');

    // Log collections
    const collections = await mongoose.connection.db.collections();
    console.log('[DB] Available collections:', collections.map(c => c.collectionName));

    // Subscribe to MongoDB connection events
    mongoose.connection.on('error', (err) => {
      console.error('[DB] MongoDB error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] MongoDB disconnected');
    });
  } catch (error) {
    console.error('[DB] Connection error:', error);
    throw error;
  }
}

module.exports = { connectToDatabase };
