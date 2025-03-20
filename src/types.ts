export interface ChatMessage {
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface JFKFile {
  id: string;
  content: string;
  title: string;
  url: string;
}

export interface SearchResult {
  content: string;
  title: string;
  url: string;
  score: number;
} 