import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useToasts } from '../../hooks';
import { debounce } from '../../utils';

// Suppress findDOMNode warnings for ReactQuill
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('findDOMNode is deprecated')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

const RichTextEditor = ({ 
  value = '', 
  onChange, 
  onImageUpload,
  placeholder = 'Start writing your post...',
  minHeight = '300px',
  maxHeight = '600px',
  autoSave = false,
  autoSaveInterval = 30000, // 30 seconds
  onAutoSave,
  readOnly = false,
  showWordCount = true,
  showToolbar = true
}) => {
  const quillRef = useRef(null);
  const [wordCount, setWordCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { addToast } = useToasts();

  // Custom image handler
  const imageHandler = useCallback(async () => {
    if (!onImageUpload) {
      addToast({
        type: 'error',
        message: 'Image upload is not configured'
      });
      return;
    }

    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          addToast({
            type: 'error',
            message: 'Image size must be less than 5MB'
          });
          return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          addToast({
            type: 'error',
            message: 'Please select a valid image file'
          });
          return;
        }

        setIsUploading(true);
        try {
          const imageUrl = await onImageUpload(file);
          
          // Insert image into editor
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection();
          const index = range ? range.index : quill.getLength();
          
          quill.insertEmbed(index, 'image', imageUrl);
          quill.setSelection(index + 1);

          addToast({
            type: 'success',
            message: 'Image uploaded successfully'
          });
        } catch (error) {
          console.error('Image upload failed:', error);
          addToast({
            type: 'error',
            message: error.message || 'Failed to upload image'
          });
        } finally {
          setIsUploading(false);
        }
      }
    };
  }, [onImageUpload, addToast]);

  // Quill modules configuration
  const modules = {
    toolbar: showToolbar ? {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    } : false,
    clipboard: {
      matchVisual: false
    }
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  // Count words in text
  const countWords = useCallback((text) => {
    if (!text) return 0;
    // Remove HTML tags and count words
    const plainText = text.replace(/<[^>]*>/g, '').trim();
    if (!plainText) return 0;
    return plainText.split(/\s+/).length;
  }, []);

  // Handle content change
  const handleChange = useCallback((content, delta, source, editor) => {
    const words = countWords(editor.getText());
    setWordCount(words);
    setHasUnsavedChanges(true);

    if (onChange) {
      // Pass both content and delta to parent
      onChange(content, editor.getContents());
    }
  }, [onChange, countWords]);

  // Debounced auto-save function
  const debouncedAutoSave = debounce(async (content) => {
    if (autoSave && onAutoSave && hasUnsavedChanges) {
      try {
        await onAutoSave(content);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        addToast({
          type: 'success',
          message: 'Draft saved automatically',
          duration: 2000
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
        addToast({
          type: 'error',
          message: 'Failed to save draft'
        });
      }
    }
  }, 2000);

  // Auto-save effect
  useEffect(() => {
    if (value) {
      debouncedAutoSave(value);
    }
  }, [value, debouncedAutoSave]);

  // Periodic auto-save
  useEffect(() => {
    if (autoSave && onAutoSave && autoSaveInterval > 0) {
      const interval = setInterval(() => {
        if (hasUnsavedChanges && value) {
          onAutoSave(value)
            .then(() => {
              setLastSaved(new Date());
              setHasUnsavedChanges(false);
            })
            .catch((error) => {
              console.error('Periodic auto-save failed:', error);
            });
        }
      }, autoSaveInterval);

      return () => clearInterval(interval);
    }
  }, [autoSave, onAutoSave, autoSaveInterval, hasUnsavedChanges, value]);

  // Initialize word count
  useEffect(() => {
    const words = countWords(value);
    setWordCount(words);
  }, [value, countWords]);

  return (
    <div className="rich-text-editor">
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={readOnly}
          style={{
            minHeight: minHeight,
            maxHeight: maxHeight
          }}
        />
        
        {/* Upload indicator */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-900 dark:text-white">Uploading image...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer with word count and auto-save status */}
      {(showWordCount || autoSave) && (
        <div className="flex justify-between items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            {showWordCount && (
              <span>
                {wordCount} word{wordCount !== 1 ? 's' : ''}
              </span>
            )}
            {autoSave && (
              <span className="flex items-center">
                {hasUnsavedChanges ? (
                  <>
                    <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                    Unsaved changes
                  </>
                ) : lastSaved ? (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Saved {lastSaved.toLocaleTimeString()}
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                    Auto-save enabled
                  </>
                )}
              </span>
            )}
          </div>
          
          {readOnly && (
            <span className="text-gray-400">Read-only mode</span>
          )}
        </div>
      )}

      <style jsx>{`
        .rich-text-editor .ql-editor {
          min-height: ${minHeight};
          max-height: ${maxHeight};
          overflow-y: auto;
        }
        
        .rich-text-editor .ql-toolbar {
          border-bottom: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }
        
        .dark .rich-text-editor .ql-toolbar {
          border-bottom-color: #374151;
          background-color: #1f2937;
        }
        
        .rich-text-editor .ql-container {
          border: none;
        }
        
        .rich-text-editor .ql-editor.ql-blank::before {
          font-style: normal;
          color: #9ca3af;
        }
        
        .dark .rich-text-editor .ql-editor.ql-blank::before {
          color: #6b7280;
        }
        
        .dark .rich-text-editor .ql-editor {
          color: #f3f4f6;
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: #9ca3af;
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-fill {
          fill: #9ca3af;
        }
        
        .dark .rich-text-editor .ql-toolbar button:hover .ql-stroke {
          stroke: #e5e7eb;
        }
        
        .dark .rich-text-editor .ql-toolbar button:hover .ql-fill {
          fill: #e5e7eb;
        }
        
        .dark .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #3b82f6;
        }
        
        .dark .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;