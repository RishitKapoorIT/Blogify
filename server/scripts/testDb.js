require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function testConnection() {
  try {
    const uri = process.env.MONGO_URI;
    const dbName = process.env.MONGO_DB_NAME;

    if (!uri) {
      console.error('MONGO_URI is not set in environment variables');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log('Connected successfully!');

    // Check users collection
    const users = await User.find({}).select('+password');
    console.log('\nUsers in database:', users.length);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testConnection().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});