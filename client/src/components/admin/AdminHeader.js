import React from 'react';
import { Link } from 'react-router-dom';

const AdminHeader = ({ 
  title, 
  description, 
  backUrl = '/admin',
  backText = 'Back to Admin Dashboard',
  actions = null,
  showBackButton = true 
}) => {
  return (
    <div className="mb-6">
      {/* Back Button */}
      {showBackButton && (
        <div className="mb-4">
          <Link 
            to={backUrl} 
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
          >
            <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {backText}
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">{description}</p>
          )}
        </div>
        
        {/* Actions */}
        {actions && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHeader;