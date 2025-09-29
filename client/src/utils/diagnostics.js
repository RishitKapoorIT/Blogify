// Diagnostic utilities for debugging API issues

export const checkServerConnection = async () => {
  const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  
  try {
    const response = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      console.log('✅ Server is running and accessible');
      return { connected: true, status: response.status };
    } else {
      console.log('❌ Server responded with error:', response.status);
      return { connected: false, status: response.status };
    }
  } catch (error) {
    console.log('❌ Cannot connect to server:', error.message);
    return { connected: false, error: error.message };
  }
};

export const checkAuthentication = () => {
  const token = localStorage.getItem('accessToken');
  const isLoggedIn = Boolean(token);
  
  console.log('Authentication status:', isLoggedIn ? '✅ Logged in' : '❌ Not logged in');
  if (token) {
    try {
      // Decode JWT to check expiration (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      console.log('Token expiration:', isExpired ? '❌ Expired' : '✅ Valid');
      return { loggedIn: isLoggedIn, expired: isExpired };
    } catch (error) {
      console.log('❌ Invalid token format');
      return { loggedIn: false, expired: true };
    }
  }
  
  return { loggedIn: isLoggedIn, expired: false };
};

export const testPostCreation = async () => {
  const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    console.log('❌ Cannot test post creation: Not logged in');
    return { success: false, error: 'Not authenticated' };
  }
  
  const testData = new FormData();
  testData.append('title', 'Test Post');
  testData.append('excerpt', 'This is a test post');
  testData.append('contentHtml', '<p>Test content</p>');
  testData.append('contentDelta', JSON.stringify({ ops: [{ insert: 'Test content\n' }] }));
  testData.append('published', 'false');
  testData.append('category', 'test');
  
  try {
    const response = await fetch(`${serverUrl}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: testData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Post creation test successful');
      return { success: true, result };
    } else {
      console.log('❌ Post creation test failed:', result);
      return { success: false, error: result.error, details: result.details };
    }
  } catch (error) {
    console.log('❌ Post creation test error:', error.message);
    return { success: false, error: error.message };
  }
};

export const runFullDiagnostics = async () => {
  console.log('🔍 Running Blogify diagnostics...\n');
  
  // Test server connection
  console.log('1. Testing server connection...');
  const serverStatus = await checkServerConnection();
  
  // Check authentication
  console.log('\n2. Checking authentication...');
  const authStatus = checkAuthentication();
  
  // Test post creation if authenticated
  if (authStatus.loggedIn && !authStatus.expired) {
    console.log('\n3. Testing post creation...');
    await testPostCreation();
  } else {
    console.log('\n3. Skipping post creation test (not authenticated)');
  }
  
  console.log('\n✅ Diagnostics complete');
  return {
    server: serverStatus,
    auth: authStatus
  };
};

export const refreshAuthToken = async () => {
  const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  
  try {
    const response = await fetch(`${serverUrl}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      const newToken = result.data?.accessToken || result.accessToken;
      
      if (newToken) {
        localStorage.setItem('accessToken', newToken);
        console.log('✅ Token refreshed successfully');
        return { success: true, token: newToken };
      }
    } else {
      console.log('❌ Token refresh failed:', response.status);
      localStorage.removeItem('accessToken');
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.log('❌ Token refresh error:', error.message);
    localStorage.removeItem('accessToken');
    return { success: false, error: error.message };
  }
};

// Add to window for easy console access
if (typeof window !== 'undefined') {
  window.blogifyDiagnostics = {
    checkServer: checkServerConnection,
    checkAuth: checkAuthentication,
    testPost: testPostCreation,
    runAll: runFullDiagnostics,
    refreshToken: refreshAuthToken
  };
}