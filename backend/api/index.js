// This file is generated during build, but we're creating it manually for deployment
const app = require('../dist/server');

// Define allowed origins
const allowedOrigins = [
  'https://chatwithjfkfiles-ovf2awylp-imran-khawajas-projects.vercel.app',
  'https://chatwithjfkfiles.vercel.app',
  'https://chatwithjfkfiles-a58t.vercel.app',
  'http://localhost:3000' // Allow local development
];

// Handle OPTIONS preflight requests
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept');
    res.sendStatus(204);
  } else {
    res.sendStatus(403);
  }
});

// Add CORS headers to all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept');
  }
  next();
});

module.exports = app; 