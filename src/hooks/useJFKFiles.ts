import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface UseJFKFilesReturn {
  searchFiles: (query: string) => Promise<string>;
  isInitialized: boolean;
}

interface SearchResponse {
  answer: string;
  sources: Array<{
    title: string;
    url: string;
    similarity: number;
  }>;
}

interface TokenResponse {
  token: string;
  expiresIn: number;
}

export const useJFKFiles = (): UseJFKFilesReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(
    localStorage.getItem('jfk_auth_token')
  );

  // Function to get a new token
  const getToken = async (): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/token`);
      if (!response.ok) {
        throw new Error('Failed to obtain token');
      }

      const data: TokenResponse = await response.json();
      
      // Store the token
      localStorage.setItem('jfk_auth_token', data.token);
      setAuthToken(data.token);

      // Set up token refresh before it expires
      // Refresh 5 minutes before expiration
      const refreshTime = (data.expiresIn - 300) * 1000;
      setTimeout(() => {
        getToken().catch(console.error);
      }, refreshTime);

      return data.token;
    } catch (error) {
      console.error('Token error:', error);
      throw error;
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        // First check server health
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        if (!healthResponse.ok) {
          throw new Error('Server health check failed');
        }

        // If no token exists, get one
        if (!authToken) {
          await getToken();
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Initialization failed:', error);
        // Retry after a delay
        setTimeout(initialize, 5000);
      }
    };

    initialize();
  }, [authToken]);

  const searchFiles = async (query: string): Promise<string> => {
    try {
      // Ensure we have a token
      const token = authToken || await getToken();
      
      const response = await fetch(`${API_BASE_URL}/api/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // If token expired, get a new one and retry
      if (response.status === 401 || response.status === 403) {
        const newToken = await getToken();
        const retryResponse = await fetch(`${API_BASE_URL}/api/search?query=${encodeURIComponent(query)}`, {
          headers: {
            'Authorization': `Bearer ${newToken}`
          }
        });
        
        if (!retryResponse.ok) {
          throw new Error('Search request failed after token refresh');
        }
        
        const data: SearchResponse = await retryResponse.json();
        return data.answer;
      }

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data: SearchResponse = await response.json();
      return data.answer;
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Failed to search files');
    }
  };

  return { searchFiles, isInitialized };
}; 