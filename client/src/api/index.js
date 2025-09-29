// Aggregator exports only; axios instance lives in http.js to avoid cycles
import API from './http';
import authAPI from './auth';
import postsAPI from './posts';
import commentsAPI from './comments';
import usersAPI from './users';
import adminAPI from './admin';

export { authAPI, postsAPI, commentsAPI, usersAPI, adminAPI };
export default API;