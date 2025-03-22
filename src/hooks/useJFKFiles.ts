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

export const useJFKFiles = (): UseJFKFilesReturn => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Health check failed:', error);
      }
    };

    checkHealth();
  }, []);

  const searchFiles = async (query: string): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data: SearchResponse = await response.json();

      // Return the AI-generated answer
      return data.answer;
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Failed to search files');
    }
  };

  return { searchFiles, isInitialized };
}; 