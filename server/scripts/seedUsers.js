/*
  Seed users for quick testing:
  - Admin: admin@blogify.dev / AdminPass123
  - User:  user@blogify.dev  / UserPass123

  Usage:
    From repo root:
      npm run seed:users
    Or from server directory:
      npm run seed:users
*/

const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env from repo root first, then fallback to local
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;

if (!MONGO_URI) {
  console.error('Seed aborted: MONGO_URI is not set. Add it to your .env.');
  process.exit(1);
}

async function connect() {
  await mongoose.connect(MONGO_URI, {
    ...(MONGO_DB_NAME ? { dbName: MONGO_DB_NAME } : {}),
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  console.log(`Connected to MongoDB${MONGO_DB_NAME ? ` (db: ${MONGO_DB_NAME})` : ''}`);
}

async function upsertUser({ name, email, password, role }) {
  const existing = await User.findOne({ email }).select('+password');
  if (existing) {
    let updated = false;
    if (role && existing.role !== role) {
      existing.role = role;
      updated = true;
    }
    if (password) {
      existing.password = password; // will be hashed by pre-save
      updated = true;
    }
    if (name && existing.name !== name) {
      existing.name = name;
      updated = true;
    }
    if (updated) {
      await existing.save();
      console.log(`Updated ${role || 'user'}: ${email}`);
    } else {
      console.log(`No changes for ${email}`);
    }
    return existing;
  }

  const user = new User({ name, email, password, role: role || 'user' });
  await user.save();
  console.log(`Created ${user.role}: ${email}`);
  return user;
}

async function run() {
  try {
    await connect();

    const admin = {
      name: 'Blogify Admin',
      email: 'admin@blogify.dev',
      password: 'AdminPass123',
      role: 'admin',
    };

    const regular = {
      name: 'Blogify User',
      email: 'user@blogify.dev',
      password: 'UserPass123',
      role: 'user',
    };

    await upsertUser(admin);
    await upsertUser(regular);

    console.log('\nSeed complete. You can log in with:');
    console.log('- Admin: admin@blogify.dev / AdminPass123');
    console.log('- User:  user@blogify.dev  / UserPass123');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
