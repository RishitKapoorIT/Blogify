import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { store } from './features/store';
import App from './App';
import ErrorBoundary from './components/common/ErrorBoundary';
import './index.css';

// Import diagnostics for development
if (process.env.NODE_ENV === 'development') {
  import('./utils/diagnostics');
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </HelmetProvider>
    </Provider>
  </React.StrictMode>
);