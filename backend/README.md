# JFK Files Chat Backend

This is the backend service for the JFK Files Chat application.

## Important Note on Embeddings

This application **requires** Mistral embeddings, which are 1024-dimensional. The database is populated with 1024-dimensional Mistral embeddings.

**DO NOT** use OpenAI embeddings as they are 1536-dimensional and will cause dimension mismatch errors with the database.

## Deployment Requirements

When deploying to Vercel, ensure the following environment variables are set:

- `MISTRAL_API_KEY`: Required for embedding generation and chat functionality
- `DATABASE_URL`: Connection string to your PostgreSQL database
- `AI_PROVIDER`: Should be set to "mistral"

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   MISTRAL_API_KEY=your_mistral_api_key
   DATABASE_URL=your_database_url
   AI_PROVIDER=mistral
   ```

3. Run the development server:
   ```
   npm run dev
   ```

## Building for Production

```
npm run build
```

This will:
1. Clean previous build artifacts
2. Build TypeScript files
3. Perform dimension validation to ensure Mistral embeddings
4. Create the API endpoint for Vercel deployment

## Troubleshooting

If you encounter dimension mismatch errors, verify that:

1. `MISTRAL_API_KEY` is properly set in your environment variables
2. The codebase is using Mistral for embeddings (not OpenAI)
3. The database contains 1024-dimensional embeddings 