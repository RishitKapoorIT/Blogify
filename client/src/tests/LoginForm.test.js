import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import LoginForm from '../components/auth/LoginForm';
import authReducer from '../features/auth/authSlice';
import uiReducer from '../features/ui/uiSlice';

// Mock store for testing
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
        ...initialState.auth,
      },
      ui: uiReducer(undefined, { type: '@@INIT' }),
    },
  });
};

// Test wrapper component
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

describe('LoginForm', () => {
  test('renders login form fields', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

  await waitFor(() => {
  expect(screen.getByText(/email is required/i)).toBeInTheDocument();
});

await waitFor(() => {
  expect(screen.getByText(/password is required/i)).toBeInTheDocument();
});
  });
  test('shows loading state during login', async () => {
    const initialState = {
      auth: { loading: true },
    };

    render(
      <TestWrapper initialState={initialState}>
        <LoginForm />
      </TestWrapper>
    );

    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
  });
});