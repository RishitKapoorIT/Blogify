require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || 'blogify'
    });
    console.log('Connected to MongoDB');
    
    const admin = await User.findOne({ email: 'admin@blogify.com' });
    if (admin) {
      const user = admin.toObject();
      delete user.password;  // Don't show password hash in output
      console.log('Admin user found:', user);
    } else {
      console.log('Admin user not found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUser();