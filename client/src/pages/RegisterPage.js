import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-200 dark:from-gray-800 dark:to-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo/Brand */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              Blogify
            </span>
          </Link>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Start your blogging journey today
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <RegisterForm />
      </div>

      {/* Benefits Section */}
      <div className="mt-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Start Your Blogging Journey
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Easy Publishing
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Publish your thoughts instantly
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Build Audience
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Grow your readership
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Engage Readers
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Comments and discussions
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Track Progress
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Monitor your growth
            </p>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="mt-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            What Our Users Say
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-semibold">JS</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Jane Smith</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Content Creator</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm italic">
              "Blogify makes it so easy to share my ideas. The editor is intuitive and the community is amazing!"
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-semibold">MD</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Mike Davis</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tech Blogger</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm italic">
              "I've grown my readership by 300% since joining. The analytics help me understand my audience better."
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-500 dark:text-gray-400">
        <p>&copy; 2025 Blogify. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <Link to="/terms" className="hover:text-gray-700 dark:hover:text-gray-300">Terms</Link>
          <Link to="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300">Privacy</Link>
          <Link to="/contact" className="hover:text-gray-700 dark:hover:text-gray-300">Contact</Link>
        </div>
      </footer>
    </div>
  );
};

export default RegisterPage;