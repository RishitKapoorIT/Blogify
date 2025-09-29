import React from 'react';
import { useUI } from '../../hooks';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => {
  const { theme } = useUI();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;