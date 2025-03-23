# JFK Files Authentication System

This document explains the JWT-based authentication system implemented for the JFK Files application.

## Overview

The application uses JSON Web Tokens (JWT) for API authentication without requiring user registration or login. This approach:

1. Protects API endpoints from direct access and potential abuse
2. Prevents automated scraping of data
3. Maintains a seamless user experience (no login required)
4. Works alongside rate limiting for better API protection

## How It Works

### Backend
- An `/api/token` endpoint generates a JWT token with a 24-hour expiration
- Protected endpoints require a valid JWT token in the Authorization header
- Rate limiting restricts requests to 100 per 15 minutes per IP address
- Origin checking ensures tokens are only issued to requests from allowed domains

### Frontend
- Automatically requests a token when the application loads
- Stores the token in localStorage for persistence across page reloads
- Includes the token in all API requests
- Handles token expiration and renewal automatically
- Refreshes tokens before they expire

## Security Features

### 1. JWT Authentication
All API endpoints (except `/health` and `/api/token`) require a valid JWT token.

### 2. Rate Limiting
The API is protected by rate limiting that restricts clients to 100 requests per 15 minutes.

### 3. Origin Checking
The token generation endpoint verifies that requests come from allowed origins:
- Checks the `Origin` and `Referer` headers against the allowlist
- Rejects token requests from unauthorized sources
- Logs rejected requests for security monitoring

### 4. Token Expiration
Tokens expire after 24 hours, limiting the window for potential misuse.

## Environment Configuration

In your backend `.env` file, add:

```
JWT_SECRET=your_secure_random_string
```

For security, make sure this is a long, random string in production.

## API Endpoints

- `/health` - Public health check endpoint (no auth required)
- `/api/token` - Token generation endpoint (origin-checked but no auth required)
- `/api/search` - Protected endpoint requiring JWT authentication
- `/api/init-files` - Protected endpoint requiring JWT authentication

## Allowed Origins

The following origins are allowed to obtain tokens:
- `https://chatwithjfkfiles-production.up.railway.app`
- `http://localhost:3000` (for local development)

To modify the allowed origins, update the `ALLOWED_ORIGINS` constant in `server.ts`.

## Testing Authentication

You can test the JWT protection by making a direct request to a protected endpoint:

```bash
# This will fail with a 401 Unauthorized error
curl http://localhost:3001/api/search?query=testing

# Get a token (this will fail if not called from an allowed origin)
TOKEN=$(curl -s -H "Origin: http://localhost:3000" http://localhost:3001/api/token | jq -r '.token')

# Use the token to access protected endpoints
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/search?query=testing
``` 