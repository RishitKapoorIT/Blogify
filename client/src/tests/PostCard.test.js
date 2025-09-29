import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import PostCard from '../components/posts/PostCard';
import postsReducer from '../features/posts/postsSlice';
import authReducer from '../features/auth/authSlice';
import uiReducer from '../features/ui/uiSlice';

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      posts: postsReducer,
      auth: authReducer,
      ui: uiReducer,
    },
    preloadedState: {
      posts: {
        posts: [],
        loading: false,
        error: null,
        ...initialState.posts,
      },
      auth: {
        user: null,
        isAuthenticated: false,
        ...initialState.auth,
      },
      ui: uiReducer(undefined, { type: '@@INIT' }),
    },
  });
};

const TestWrapper = ({ children, initialState = {} }) => {
  const store = createMockStore(initialState);
  return (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );
};

const mockPost = {
  _id: '1',
  title: 'Test Post',
  excerpt: 'This is a test post excerpt',
  slug: 'test-post',
  author: {
    _id: 'user1',
    name: 'John Doe',
    avatar: null,
  },
  category: 'Technology',
  tags: ['react', 'testing'],
  likesCount: 5,
  commentsCount: 3,
  readTime: 5,
  createdAt: '2023-01-01T00:00:00.000Z',
  coverImage: null,
  isLiked: false,
  isBookmarked: false,
};

describe('PostCard', () => {
  test('renders post information correctly', () => {
    render(
      <TestWrapper>
        <PostCard post={mockPost} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText('This is a test post excerpt')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('5 min read')).toBeInTheDocument();
  });

  test('shows like and comment counts', () => {
    render(
      <TestWrapper>
        <PostCard post={mockPost} />
      </TestWrapper>
    );

    expect(screen.getByText('5')).toBeInTheDocument(); // likes
    expect(screen.getByText('3')).toBeInTheDocument(); // comments
  });

  test('renders tags correctly', () => {
    render(
      <TestWrapper>
        <PostCard post={mockPost} />
      </TestWrapper>
    );

    expect(screen.getByText('#react')).toBeInTheDocument();
    expect(screen.getByText('#testing')).toBeInTheDocument();
  });
});