const request = require('supertest');
const mongoose = require('mongoose');
let app; // require conditionally when running DB tests
const User = require('../models/User');
const Post = require('../models/Post');

const runDbTests = process.env.RUN_DB_TESTS === 'true';
const d = runDbTests ? describe : describe.skip;

d('Bookmarks API', () => {
  let server;
  let token;
  let userId;
  let postId;

  beforeAll(async () => {
        // Load app only when running DB tests
        if (!app) {
          app = require('../server');
        }
      // Ensure DB is connected (only when MONGO_URI is provided)
      if (mongoose.connection.readyState === 0) {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('RUN_DB_TESTS=true but no MONGO_URI provided');
        await mongoose.connect(mongoUri, { dbName: process.env.MONGO_DB_NAME || 'blogify_test' });
      }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Post.deleteMany({});

    // Create a user
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Tester', email: 'tester@example.com', password: 'StrongP4ss!' });
    token = (res.body && (res.body.data?.accessToken || res.body.accessToken));
    expect(token).toBeTruthy();

    // Get user id
    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    userId = me.body?.data?.user?.id;
    expect(userId).toBeTruthy();

    // Create a post directly via model (published)
    const post = await Post.create({
      title: 'Hello',
      slug: 'hello',
      excerpt: 'Ex',
      contentDelta: {},
      contentHtml: '<p>Hi there</p>',
      author: userId,
      tags: ['test'],
      category: 'gen',
      published: true
    });
    postId = post._id.toString();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  test('toggle bookmark and list bookmarks', async () => {
    // Initially, list is empty
    const initialList = await request(app)
      .get('/api/users/me/bookmarks')
      .set('Authorization', `Bearer ${token}`);
    expect(initialList.status).toBe(200);
    expect(initialList.body?.data?.posts || []).toHaveLength(0);

    // Toggle bookmark on
    const toggleOn = await request(app)
      .post(`/api/users/me/bookmarks/${postId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(toggleOn.status).toBe(200);
    expect(toggleOn.body?.data?.isBookmarked).toBe(true);

    // List now has 1
    const afterAdd = await request(app)
      .get('/api/users/me/bookmarks')
      .set('Authorization', `Bearer ${token}`);
    expect(afterAdd.status).toBe(200);
    expect(afterAdd.body?.data?.posts || []).toHaveLength(1);

    // Toggle bookmark off
    const toggleOff = await request(app)
      .post(`/api/users/me/bookmarks/${postId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(toggleOff.status).toBe(200);
    expect(toggleOff.body?.data?.isBookmarked).toBe(false);

    // List now empty again
    const afterRemove = await request(app)
      .get('/api/users/me/bookmarks')
      .set('Authorization', `Bearer ${token}`);
    expect(afterRemove.status).toBe(200);
    expect(afterRemove.body?.data?.posts || []).toHaveLength(0);
  });
});
