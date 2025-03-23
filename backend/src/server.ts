import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { processText, generateEmbedding } from './utils/textProcessing';
import { createAIProvider } from './utils/aiProviders';

// Move this to the very top, before other imports
dotenv.config();

// Add some debugging
console.log('Environment check:');
console.log('- PORT:', process.env.PORT);
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set (hidden)' : 'Not set');
console.log('- MISTRAL_API_KEY:', process.env.MISTRAL_API_KEY ? 'Set (hidden)' : 'Not set');
console.log('- AI_PROVIDER:', process.env.AI_PROVIDER || 'openai');

const app = express();
const port = process.env.PORT || 3001;

// Initialize AI provider
const aiProvider = createAIProvider(
  process.env.AI_PROVIDER || 'openai',
  process.env.AI_PROVIDER === 'mistral' ? process.env.MISTRAL_API_KEY! : process.env.OPENAI_API_KEY!
);

// Middleware
app.use(cors({
  origin: [
    'https://chatwithjfkfiles-production.up.railway.app',
    'http://localhost:3000' // for local development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Search endpoint
app.get('/api/search', async (req, res) => {
  const { query } = req.query;
  console.log('Received query:', query);
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    // Generate embedding for the query
    console.log('Generating embedding for query...');
    const queryEmbedding = await generateEmbedding(query, aiProvider);
    console.log('Generated embedding length:', queryEmbedding.length);
    
    // Format the embedding for PostgreSQL vector type
    const formattedEmbedding = `[${queryEmbedding.join(',')}]`;
    console.log('Formatted embedding (first few values):', formattedEmbedding.substring(0, 100) + '...');

    // First, let's check if we have any chunks in the database
    const chunkCount = await pool.query('SELECT COUNT(*) FROM chunks');
    console.log('Total chunks in database:', chunkCount.rows[0].count);

    // Search for similar chunks
    console.log('Executing similarity search...');
    const result = await pool.query(
      `WITH similar_chunks AS (
        SELECT 
          c.id,
          c.content,
          c.chunk_index,
          f.file_path,
          f.title,
          f.url,
          1 - (c.embedding <=> $1::vector) as similarity,
          -- Add position-based scoring to favor chunks that appear earlier in documents
          CASE 
            WHEN c.chunk_index = 0 THEN 1.0
            ELSE 1.0 / (1.0 + c.chunk_index * 0.1)
          END as position_score,
          -- Add length-based scoring to favor chunks of appropriate length
          CASE 
            WHEN length(c.content) BETWEEN 100 AND 1000 THEN 1.0
            ELSE 0.8
          END as length_score
        FROM chunks c
        JOIN files f ON c.file_id = f.id
        WHERE 1 - (c.embedding <=> $1::vector) > 0.5  -- Lower threshold to 0.5
        ORDER BY 
          (1 - (c.embedding <=> $1::vector)) * 
          CASE 
            WHEN c.chunk_index = 0 THEN 1.0
            ELSE 1.0 / (1.0 + c.chunk_index * 0.1)
          END * 
          CASE 
            WHEN length(c.content) BETWEEN 100 AND 1000 THEN 1.0
            ELSE 0.8
          END DESC
        LIMIT 10  -- Reduce to top 10 most relevant chunks
      )
      SELECT 
        file_path,
        title,
        content,
        url,
        similarity as rank,
        chunk_index,
        position_score,
        length_score
      FROM similar_chunks
      ORDER BY rank DESC`,
      [formattedEmbedding]
    );

    console.log('Search results count:', result.rows.length);
    
    if (result.rows.length === 0) {
      // Let's check what the highest similarity score is, even if below threshold
      const maxSimilarity = await pool.query(
        `SELECT MAX(1 - (embedding <=> $1::vector)) as max_similarity FROM chunks`,
        [formattedEmbedding]
      );
      console.log('Maximum similarity score found:', maxSimilarity.rows[0].max_similarity);
      
      return res.json({ 
        answer: "I apologize, but I couldn't find any relevant information to answer your question. Could you please try rephrasing your question or ask about a different topic?",
        sources: []
      });
    }

    // Construct context from the retrieved chunks
    const context = await Promise.all(result.rows.map(async (row) => {
      // Get surrounding chunks for better context
      const surroundingChunks = await pool.query(
        `SELECT content, chunk_index
         FROM chunks
         WHERE file_id = (SELECT id FROM files WHERE file_path = $1)
         AND chunk_index BETWEEN $2 - 1 AND $2 + 1
         ORDER BY chunk_index`,
        [row.file_path, row.chunk_index]
      );

      // Combine chunks with proper formatting
      const chunks = surroundingChunks.rows
        .map(chunk => chunk.content)
        .join('\n\n');

      return `From ${row.title} (Similarity: ${row.rank.toFixed(2)}):\n\n${chunks}\n\nSource: ${row.url}`;
    }));

    // Generate a response using the selected AI provider
    const answer = await aiProvider.generateResponse([
      {
        role: "system",
        content: `You are a helpful assistant that answers questions about JFK files. Use the provided context to answer the user's question. 
        Guidelines:
        1. Only use information from the provided context
        2. If the context doesn't contain enough information to fully answer the question, say so
        3. Always cite your sources using the file titles and similarity scores provided
        4. If you find conflicting information in different sources, mention this
        5. Be precise and factual in your responses
        6. If you're not certain about something, express that uncertainty`
      },
      {
        role: "user",
        content: `Context:\n${context.join('\n\n---\n\n')}\n\nQuestion: ${query}`
      }
    ]);

    // Return both the answer and the sources
    res.json({
      answer,
      sources: result.rows.map(row => ({
        title: row.title,
        url: row.url,
        similarity: row.rank
      }))
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize files endpoint
app.post('/api/init-files', async (req, res) => {
  try {
    // Check if files already exist
    const existingFiles = await pool.query('SELECT COUNT(*) FROM files');
    console.log('Existing files count:', existingFiles.rows[0].count);
    
    if (existingFiles.rows[0].count > 0) {
      // Let's check the chunks too
      const existingChunks = await pool.query('SELECT COUNT(*) FROM chunks');
      console.log('Existing chunks count:', existingChunks.rows[0].count);
      
      return res.json({ 
        message: 'Files already initialized',
        fileCount: existingFiles.rows[0].count,
        chunkCount: existingChunks.rows[0].count
      });
    }

    // Fetch files from GitHub
    const response = await fetch('https://api.github.com/repos/amasad/jfk_files/git/trees/main?recursive=1');
    const data = await response.json();
    
    const markdownFiles = data.tree
      .filter((file: { path: string }) => file.path.endsWith('.md'))
      .map((file: { path: string }) => file.path);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const filePath of markdownFiles) {
        const content = await fetch(`https://raw.githubusercontent.com/amasad/jfk_files/main/${filePath}`)
          .then(r => r.text());

        // Insert file metadata
        const fileResult = await client.query(
          `INSERT INTO files (file_path, title, content, url)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (file_path) DO UPDATE
           SET content = $3, updated_at = CURRENT_TIMESTAMP
           RETURNING id`,
          [
            filePath,
            filePath.split('/').pop() || filePath,
            content,
            `https://github.com/amasad/jfk_files/blob/main/${filePath}`
          ]
        );

        const fileId = fileResult.rows[0].id;

        // Process and insert chunks
        const processedChunks = await processText(content, aiProvider);
        console.log(`Generated ${processedChunks.length} chunks for file: ${filePath}`);
        
        for (const chunk of processedChunks) {
          console.log(`Inserting chunk ${chunk.index} with embedding length:`, chunk.embedding.length);
          await client.query(
            `INSERT INTO chunks (file_id, content, embedding, chunk_index)
             VALUES ($1, $2, $3::vector, $4)
             ON CONFLICT (file_id, chunk_index) DO UPDATE
             SET content = $2, embedding = $3::vector`,
            [
              fileId, 
              chunk.content, 
              `[${chunk.embedding.join(',')}]`,
              chunk.index
            ]
          );
        }
      }

      await client.query('COMMIT');
      res.json({ message: 'Files initialized successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Initialization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 