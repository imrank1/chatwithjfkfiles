import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography,
  CircularProgress,
  ThemeProvider,
  createTheme
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { ChatMessage } from './types';
import { ChatWindow } from './components/ChatWindow';
import { useJFKFiles } from './hooks/useJFKFiles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { searchFiles, isInitialized } = useJFKFiles();

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await searchFiles(input);
      const assistantMessage: ChatMessage = {
        type: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error searching files:', error);
      const errorMessage: ChatMessage = {
        type: 'assistant',
        content: 'Sorry, I encountered an error while searching the files. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" sx={{ height: '100vh', py: 4 }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Chat with JFK Files
          </Typography>
          
          <Paper 
            elevation={3} 
            sx={{ 
              flex: 1, 
              mb: 2, 
              p: 2, 
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {!isInitialized ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (
              <ChatWindow messages={messages} />
            )}
          </Paper>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about the JFK files..."
              disabled={isLoading || !isInitialized}
            />
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={isLoading || !isInitialized || !input.trim()}
              sx={{ minWidth: '100px' }}
            >
              {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App; 