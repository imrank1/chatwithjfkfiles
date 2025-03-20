import React, { useEffect, useRef } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { ChatMessage } from '../types';
import { marked } from 'marked';

interface ChatWindowProps {
  messages: ChatMessage[];
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderMarkdown = (content: string): string => {
    return marked.parseInline(content) as string;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {messages.map((message, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
          }}
        >
          <Paper
            elevation={1}
            sx={{
              p: 2,
              maxWidth: '80%',
              backgroundColor: message.type === 'user' ? 'primary.light' : 'background.paper',
              color: message.type === 'user' ? 'primary.contrastText' : 'text.primary',
            }}
          >
            <Typography
              variant="body1"
              component="div"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            />
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1,
                opacity: 0.7,
              }}
            >
              {message.timestamp.toLocaleTimeString()}
            </Typography>
          </Paper>
        </Box>
      ))}
      <div ref={messagesEndRef} />
    </Box>
  );
}; 