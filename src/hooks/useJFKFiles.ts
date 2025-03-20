import { useState, useEffect } from 'react';
import { SearchResult } from '../types';

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
        console.log('Checking health at:', `${API_BASE_URL}/health`);
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        console.log('Health check response:', response.status);
        if (response.ok) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Health check failed:', error);
        // For development purposes, let's still initialize even if health check fails
        setIsInitialized(true);
      }
    };

    checkHealth();
  }, []);

  const searchFiles = async (query: string): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/search?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Search request failed: ${response.status}`);
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