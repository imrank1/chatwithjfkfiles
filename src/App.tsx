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
  createTheme,
  alpha
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { ChatMessage } from './types';
import { ChatWindow } from './components/ChatWindow';
import { useJFKFiles } from './hooks/useJFKFiles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ff00',
    },
    background: {
      default: '#000000',
      paper: alpha('#000000', 0.8),
    },
    text: {
      primary: '#00ff00',
      secondary: '#00ff00',
    },
  },
  typography: {
    fontFamily: '"Courier New", Courier, monospace',
    h4: {
      textTransform: 'uppercase',
      letterSpacing: '0.2em',
      textShadow: '0 0 10px #00ff00',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(45deg, rgba(0,255,0,0.1) 25%, transparent 25%, transparent 50%, rgba(0,255,0,0.1) 50%, rgba(0,255,0,0.1) 75%, transparent 75%, transparent)',
          backgroundSize: '10px 10px',
          border: '1px solid #00ff00',
          boxShadow: '0 0 20px rgba(0,255,0,0.2)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#00ff00',
            },
            '&:hover fieldset': {
              borderColor: '#00ff00',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00ff00',
            },
            color: '#00ff00',
            backgroundColor: alpha('#000000', 0.8),
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 255, 0, 0.2)',
          border: '1px solid #00ff00',
          color: '#00ff00',
          '&:hover': {
            backgroundColor: 'rgba(0, 255, 0, 0.4)',
          },
          '&:disabled': {
            backgroundColor: 'rgba(0, 255, 0, 0.05)',
            borderColor: 'rgba(0, 255, 0, 0.3)',
            color: 'rgba(0, 255, 0, 0.3)',
          },
          transition: 'all 0.3s ease',
        },
      },
    },
  },
});

// Add animation keyframe for fade out
const fadeOutAnimation = {
  '@keyframes fadeOut': {
    from: {
      opacity: 1,
      maxHeight: '350px',
    },
    to: {
      opacity: 0,
      maxHeight: '0px',
    },
  },
};

// Add this constant for the background decorations
const TOP_SECRET_DECORATIONS = [
  { angle: -45, top: '10%', left: '5%' },
  { angle: 30, top: '30%', right: '8%' },
  { angle: -20, bottom: '15%', left: '10%' },
  { angle: 15, bottom: '25%', right: '12%' },
  { angle: 40, top: '50%', left: '15%' },
  { angle: -30, top: '70%', right: '7%' },
];

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
      <Box
        sx={{
          ...fadeOutAnimation,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: -1,
          '& .top-secret-text': {
            position: 'absolute',
            fontSize: '24px',
            color: 'rgba(255,0,0,0.1)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            fontFamily: '"Courier New", Courier, monospace',
            fontWeight: 'bold',
          },
        }}
      >
        {TOP_SECRET_DECORATIONS.map((decoration, index) => (
          <Box
            key={index}
            className="top-secret-text"
            sx={{
              ...decoration,
              transform: `rotate(${decoration.angle}deg)`,
            }}
          >
            TOP SECRET
          </Box>
        ))}
      </Box>
      <Container maxWidth="md" sx={{ height: '100vh', py: 4 }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            align="center"
            sx={{
              position: 'relative',
              '&::before': {
                content: '"CLASSIFIED"',
                position: 'absolute',
                top: -20,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '0.5em',
                color: '#ff0000',
                letterSpacing: '0.3em',
              }
            }}
          >
            JFK Files Database
          </Typography>

          <Typography 
            variant="subtitle1" 
            component="p" 
            gutterBottom 
            align="center"
            sx={{
              fontSize: '0.9em',
              color: '#000000',
              mb: 2
            }}
          >
            Data sourced from <Box component="span" sx={{ textDecoration: 'underline' }}>github.com/amasad/jfk_files</Box>. All answers are derived exclusively from these files.
          </Typography>

          {messages.length === 0 && (
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                mb: 3,
                mt: -1,
                animation: messages.length > 0 ? 'fadeOut 0.5s ease-out forwards' : 'none',
              }}
            >
              <Box
                component="img"
                src="/assets/jfkintent.jpg"
                alt="JFK at computer terminal"
                sx={{
                  maxWidth: {
                    xs: '85%',
                    sm: '70%',
                    md: '60%',
                    lg: '50%'
                  },
                  maxHeight: {
                    xs: '200px',
                    sm: '250px',
                    md: '300px',
                    lg: '350px'
                  },
                  objectFit: 'cover',
                  height: 'auto',
                  borderRadius: '4px',
                  border: '1px solid #00ff00',
                  boxShadow: '0 0 15px rgba(0,255,0,0.3)',
                }}
              />
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your query about the classified documents..."
              disabled={isLoading || !isInitialized}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(0,0,0,0.7)',
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={isLoading || !isInitialized || !input.trim()}
              sx={{ 
                minWidth: '100px',
                '&:hover .MuiSvgIcon-root': {
                  transform: 'scale(1.1)',
                },
                '& .MuiSvgIcon-root': {
                  transition: 'transform 0.3s ease',
                }
              }}
            >
              {isLoading ? <CircularProgress size={24} sx={{ color: '#00ff00' }} /> : <SendIcon />}
            </Button>
          </Box>
          
          <Paper 
            elevation={3} 
            sx={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.5s ease-in-out',
              marginTop: messages.length > 0 ? 0 : undefined,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'repeating-linear-gradient(0deg, rgba(0,255,0,0.1) 0px, rgba(0,255,0,0.1) 1px, transparent 1px, transparent 2px)',
                pointerEvents: 'none',
                opacity: 0.5,
              }
            }}
          >
            {!isInitialized ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress sx={{ color: '#00ff00' }} />
              </Box>
            ) : (
              <Box sx={{ 
                flex: 1, 
                overflow: 'auto',
                p: 2,
              }}>
                <ChatWindow messages={messages} />
              </Box>
            )}
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App; 