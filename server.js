const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Log environment variables for debugging
console.log(`Environment check:
- PORT: ${PORT}
`);

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, 'build')));

// Send all requests to the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
}); 