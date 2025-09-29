require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function testDb() {
  try {
    console.log('\n=== Database Connection Test ===');
    const uri = process.env.MONGO_URI;
    const dbName = process.env.MONGO_DB_NAME;

    if (!uri) {
      throw new Error('MONGO_URI is not set in .env file');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected successfully!\n');

    // List all collections
    const collections = await mongoose.connection.db.collections();
    console.log('Collections in database:');
    for (const collection of collections) {
      const count = await collection.countDocuments();
      console.log(`- ${collection.collectionName}: ${count} documents`);
    }
    
    // Check for admin user
    console.log('\nChecking admin user...');
    const adminUser = await User.findOne({ email: 'admin@blogify.dev' }).select('+password');
    if (adminUser) {
      console.log('Admin user exists:');
      console.log('- ID:', adminUser._id);
      console.log('- Name:', adminUser.name);
      console.log('- Role:', adminUser.role);
      console.log('- Password exists:', !!adminUser.password);
      
      // Test password validation
      const testPass = 'AdminPass123';
      const isValid = await adminUser.comparePassword(testPass);
      console.log('- Test password valid:', isValid);
    } else {
      console.log('Admin user not found!');
    }

  } catch (error) {
    console.error('\nERROR:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

testDb();