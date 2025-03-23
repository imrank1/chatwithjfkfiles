const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Log all environment variables for debugging
console.log('All environment variables:');
console.log(process.env);

// Add a health check endpoint - make this the FIRST route
app.get('/health', (req, res) => {
  console.log('Health check received');
  res.status(200).send('OK');
});

// Add another common health check path
app.get('/_health', (req, res) => {
  console.log('Alternative health check received');
  res.status(200).send('OK');
});

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, 'build')));

// Send all requests to the React app
app.get('*', (req, res) => {
  console.log(`Serving request for: ${req.path}`);
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Handle errors
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Server Error');
});

// Start the server with better error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 