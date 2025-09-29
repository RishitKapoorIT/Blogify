const sanitizeHtml = require('sanitize-html');

// Configuration for sanitizing HTML content
const sanitizeOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'div', 'span', 'br',
    'strong', 'b', 'em', 'i', 'u', 's', 'del',
    'a', 'img',
    'ul', 'ol', 'li',
    'blockquote', 'cite',
    'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'hr'
  ],
  allowedAttributes: {
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height', 'style'],
    'p': ['style', 'class'],
    'div': ['style', 'class'],
    'span': ['style', 'class'],
    'h1': ['style', 'class'],
    'h2': ['style', 'class'],
    'h3': ['style', 'class'],
    'h4': ['style', 'class'],
    'h5': ['style', 'class'],
    'h6': ['style', 'class'],
    'blockquote': ['style', 'class'],
    'ul': ['style', 'class'],
    'ol': ['style', 'class'],
    'li': ['style', 'class'],
    'table': ['style', 'class'],
    'thead': ['style', 'class'],
    'tbody': ['style', 'class'],
    'tr': ['style', 'class'],
    'td': ['style', 'class'],
    'th': ['style', 'class'],
    'code': ['class'],
    'pre': ['class']
  },
  allowedStyles: {
    '*': {
      // Allow text styling
      'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/],
      'background-color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/],
      'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
      'font-size': [/^\d+(?:px|em|rem|%)?$/],
      'font-weight': [/^(?:normal|bold|bolder|lighter|\d+)$/],
      'font-style': [/^(?:normal|italic|oblique)$/],
      'text-decoration': [/^(?:none|underline|line-through)$/],
      'margin': [/^\d+(?:px|em|rem|%)?$/],
      'margin-top': [/^\d+(?:px|em|rem|%)?$/],
      'margin-bottom': [/^\d+(?:px|em|rem|%)?$/],
      'margin-left': [/^\d+(?:px|em|rem|%)?$/],
      'margin-right': [/^\d+(?:px|em|rem|%)?$/],
      'padding': [/^\d+(?:px|em|rem|%)?$/],
      'padding-top': [/^\d+(?:px|em|rem|%)?$/],
      'padding-bottom': [/^\d+(?:px|em|rem|%)?$/],
      'padding-left': [/^\d+(?:px|em|rem|%)?$/],
      'padding-right': [/^\d+(?:px|em|rem|%)?$/]
    }
  },
  allowedSchemes: ['http', 'https', 'mailto', 'data'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data']
  },
  transformTags: {
    // Ensure external links open in new tab
    'a': function(tagName, attribs) {
      if (attribs.href && (attribs.href.startsWith('http://') || attribs.href.startsWith('https://'))) {
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            target: '_blank',
            rel: 'noopener noreferrer'
          }
        };
      }
      return {
        tagName: 'a',
        attribs
      };
    }
  }
};

// Strict sanitization for comments (more restrictive)
const commentSanitizeOptions = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'code'],
  allowedAttributes: {
    'a': ['href', 'title', 'target', 'rel']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    'a': function(tagName, attribs) {
      if (attribs.href && (attribs.href.startsWith('http://') || attribs.href.startsWith('https://'))) {
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            target: '_blank',
            rel: 'noopener noreferrer'
          }
        };
      }
      return {
        tagName: 'a',
        attribs
      };
    }
  }
};

// Sanitize post content HTML
const sanitizePostContent = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    const sanitized = sanitizeHtml(html, sanitizeOptions);
    return sanitized;
  } catch (error) {
    console.error('HTML sanitization error:', error);
    return '';
  }
};

// Sanitize comment content HTML
const sanitizeComment = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    const sanitized = sanitizeHtml(html, commentSanitizeOptions);
    return sanitized;
  } catch (error) {
    console.error('Comment sanitization error:', error);
    return '';
  }
};

// Extract plain text from HTML (for excerpts, search indexing)
const extractPlainText = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    const plainText = sanitizeHtml(html, {
      allowedTags: [],
      allowedAttributes: {}
    });
    
    // Clean up extra whitespace
    return plainText.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('Plain text extraction error:', error);
    return '';
  }
};

// Generate excerpt from HTML content
const generateExcerpt = (html, maxLength = 200) => {
  const plainText = extractPlainText(html);
  
  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Find the last complete word before the limit
  const truncated = plainText.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > 0) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
};

// Validate and sanitize Quill Delta object
const sanitizeDelta = (delta) => {
  if (!delta || typeof delta !== 'object' || !Array.isArray(delta.ops)) {
    return null;
  }

  try {
    // Basic validation of Delta structure
    const sanitizedOps = delta.ops.map(op => {
      const sanitizedOp = { ...op };
      
      // Remove any potentially dangerous attributes
      if (sanitizedOp.attributes) {
        // Keep only safe formatting attributes
        const safeAttributes = {};
        const allowedAttrs = [
          'bold', 'italic', 'underline', 'strike',
          'color', 'background', 'size', 'font',
          'align', 'list', 'indent',
          'header', 'blockquote', 'code-block',
          'link', 'image'
        ];

        Object.keys(sanitizedOp.attributes).forEach(key => {
          if (allowedAttrs.includes(key)) {
            safeAttributes[key] = sanitizedOp.attributes[key];
          }
        });

        sanitizedOp.attributes = safeAttributes;
      }

      return sanitizedOp;
    });

    return {
      ops: sanitizedOps
    };
  } catch (error) {
    console.error('Delta sanitization error:', error);
    return null;
  }
};

// Remove or replace dangerous URLs
const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Remove javascript: and data: URLs (except for images)
  if (url.toLowerCase().startsWith('javascript:') || 
      url.toLowerCase().startsWith('vbscript:') ||
      url.toLowerCase().startsWith('data:text/') ||
      url.toLowerCase().startsWith('data:application/')) {
    return '';
  }

  return url;
};

// Validate HTML content length
const validateContentLength = (html, maxLength = 50000) => {
  const plainText = extractPlainText(html);
  return plainText.length <= maxLength;
};

// Clean and normalize whitespace in text
const normalizeText = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, '\n\n')  // Normalize line breaks
    .trim();
};

module.exports = {
  sanitizePostContent,
  sanitizeComment,
  extractPlainText,
  generateExcerpt,
  sanitizeDelta,
  sanitizeUrl,
  validateContentLength,
  normalizeText,
  sanitizeOptions,
  commentSanitizeOptions
};