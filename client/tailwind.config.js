/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#374151',
            lineHeight: '1.7',
            'h1, h2, h3, h4, h5, h6': {
              fontWeight: '600',
              color: '#111827',
            },
            'h1': {
              fontSize: '2.25rem',
              marginTop: '0',
              marginBottom: '1rem',
            },
            'h2': {
              fontSize: '1.875rem',
              marginTop: '2rem',
              marginBottom: '1rem',
            },
            'h3': {
              fontSize: '1.5rem',
              marginTop: '1.5rem',
              marginBottom: '0.5rem',
            },
            'p': {
              marginTop: '1rem',
              marginBottom: '1rem',
            },
            'a': {
              color: '#2563eb',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            'blockquote': {
              fontStyle: 'italic',
              borderLeftWidth: '4px',
              borderLeftColor: '#e5e7eb',
              paddingLeft: '1rem',
              marginLeft: '0',
              marginRight: '0',
            },
            'code': {
              backgroundColor: '#f3f4f6',
              paddingTop: '0.25rem',
              paddingBottom: '0.25rem',
              paddingLeft: '0.5rem',
              paddingRight: '0.5rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            },
            'pre': {
              backgroundColor: '#1f2937',
              color: '#f9fafb',
              borderRadius: '0.5rem',
              padding: '1rem',
              overflow: 'auto',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
            },
            'img': {
              borderRadius: '0.5rem',
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
            },
            'ul, ol': {
              marginTop: '1rem',
              marginBottom: '1rem',
            },
            'li': {
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}