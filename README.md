# 📝 Blogify

![GitHub last commit](https://img.shields.io/github/last-commit/RishitKapoorIT/Blogify)
![GitHub issues](https://img.shields.io/github/issues/RishitKapoorIT/Blogify)

A modern, feature-rich blogging platform built with the MERN stack (MongoDB, Express, React, Node.js). Create, share, and engage with content in a beautiful, responsive environment.

## 🎯 Target Users

- ✍️ **Content Creators** - Writers, bloggers, and journalists
- 📚 **Readers** - Engage with content through comments and likes
- 🛡️ **Administrators** - Manage content and user access

## Structure
- `server/`: Express API with MongoDB (Mongoose)
- `client/`: React (Vite) + Redux Toolkit + Tailwind

## Quickstart (Windows PowerShell)
1. Install dependencies:
```
npm --prefix server install
npm --prefix client install
npm install
```
2. Configure environment:
- Copy `server/.env.example` to `server/.env` and fill values
- Copy `client/.env.example` to `client/.env` (adjust API URL if needed)

3. Run both server and client:
```
npm run dev
```
- Server: http://localhost:3001
- Client: http://localhost:5173

4. Health check:
```
Invoke-WebRequest http://localhost:3001/health -UseBasicParsing
```

## Notes
- If `MONGO_URI` isn’t set, the server will start but skip DB connection.
- Update `CLIENT_ORIGIN` in `server/.env` if the client runs on a different URL.
# Blogify

A full-stack blogging platform built with React and Node.js.

## Features

- 🔐 JWT-based authentication with refresh tokens
- ✍️ Rich text editor with image upload support
- 💬 Comment system with nested replies
- ❤️ Like/unlike posts functionality
- 🏷️ Tag and category filtering
- 🔍 Full-text search
- 👤 User profiles and post management
- 🛡️ Admin dashboard for moderation
- 📱 Responsive design with Tailwind CSS
- ☁️ Cloudinary integration for image storage

## Architecture

- **Frontend**: React + Redux Toolkit + Tailwind CSS + React Quill
- **Backend**: Node.js + Express + MongoDB + Mongoose
- **Authentication**: JWT with refresh token strategy
- **File Storage**: Cloudinary
- **Deployment**: Vercel (frontend) + Railway/Render (backend)

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
MONGO_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=http://localhost:3000
```

4. Start development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

4. Start development server:
```bash
npm start
```

## Project Structure

```
Blogify/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── features/       # Redux slices
│   │   ├── pages/          # Page components
│   │   ├── api/            # API utilities
│   │   └── utils/          # Helper functions
│   └── public/
└── server/                 # Express backend
    ├── controllers/        # Route handlers
    ├── models/            # Mongoose models
    ├── routes/            # API routes
    ├── middleware/        # Custom middleware
    ├── utils/             # Helper functions
    └── tests/             # Test files
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - User logout

### Posts
- `GET /api/posts` - List posts (with pagination, search, filters)
- `GET /api/posts/:slug` - Get single post
- `POST /api/posts` - Create post (auth required)
- `PUT /api/posts/:id` - Update post (auth required)
- `DELETE /api/posts/:id` - Delete post (auth required)
- `POST /api/posts/:id/like` - Toggle like (auth required)

### Comments
- `GET /api/posts/:id/comments` - Get post comments
- `POST /api/posts/:id/comments` - Add comment (auth required)
- `DELETE /api/comments/:id` - Delete comment (auth required)

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/me` - Update profile (auth required)
- `GET /api/users/me` - Get current user info (auth required)

### Admin
- `GET /api/admin/users` - List users (admin only)
- `PUT /api/admin/users/:id/role` - Change user role (admin only)
- `GET /api/admin/posts` - List all posts (admin only)
- `DELETE /api/admin/posts/:id` - Delete any post (admin only)

## Testing

### Backend Tests
```bash
cd server
npm test
```

### Frontend Tests
```bash
cd client
npm test
```

## Deployment

### Backend (Railway/Render)
1. Push to GitHub
2. Connect to Railway/Render
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)
1. Push to GitHub
2. Connect to Vercel/Netlify
3. Set build command: `npm run build`
4. Set publish directory: `build`
5. Deploy

## Security Features

- Password hashing with bcrypt
- JWT access & refresh tokens
- CORS protection
- Rate limiting
- Input validation & sanitization
- XSS protection for rich text content
- Security headers with Helmet

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request
