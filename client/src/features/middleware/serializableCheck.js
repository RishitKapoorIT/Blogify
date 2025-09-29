import { isPlainObject } from '@reduxjs/toolkit';

export const customSerializableCheck = {
  isSerializable: (value) => {
    if (typeof value === 'string' || 
        typeof value === 'number' || 
        typeof value === 'boolean' || 
        value === null || 
        value === undefined) {
      return true;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.every(item => customSerializableCheck.isSerializable(item));
    }
    
    // Handle Date objects - convert to ISO string
    if (value instanceof Date) {
      return true;
    }

    // Handle plain objects recursively
    if (isPlainObject(value)) {
      return Object.values(value).every(item => customSerializableCheck.isSerializable(item));
    }

    return false;
  },
  
  getEntries: (value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }
};