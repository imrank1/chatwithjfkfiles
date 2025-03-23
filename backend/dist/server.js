"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const pg_1 = require("pg");
const textProcessing_1 = require("./utils/textProcessing");
// Move this to the very top, before other imports
dotenv_1.default.config();
// Add some debugging
console.log('Environment check:');
console.log('- PORT:', process.env.PORT);
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set (hidden)' : 'Not set');
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Database connection
const pool = new pg_1.Pool({
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
    console.log('Received query:', query);
    try {
        // Generate embedding for the query
        const queryEmbedding = await (0, textProcessing_1.generateEmbedding)(query);
        // Format the embedding for PostgreSQL vector type
        const formattedEmbedding = `[${queryEmbedding.join(',')}]`;
        // Search for similar chunks
        const result = await pool.query(`WITH similar_chunks AS (
        SELECT 
          c.id,
          c.content,
          c.chunk_index,
          f.file_path,
          f.title,
          f.url,
          1 - (c.embedding <=> $1::vector) as similarity
        FROM chunks c
        JOIN files f ON c.file_id = f.id
        WHERE 1 - (c.embedding <=> $1::vector) > 0.7
        ORDER BY c.embedding <=> $1::vector
        LIMIT 5
      )
      SELECT 
        file_path,
        title,
        content,
        url,
        similarity as rank,
        chunk_index
      FROM similar_chunks
      ORDER BY rank DESC`, [formattedEmbedding]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Initialize files endpoint
app.post('/api/init-files', async (req, res) => {
    try {
        // Check if files already exist
        const existingFiles = await pool.query('SELECT COUNT(*) FROM files');
        if (existingFiles.rows[0].count > 0) {
            return res.json({
                message: 'Files already initialized',
                count: existingFiles.rows[0].count
            });
        }
        // Fetch files from GitHub
        const response = await fetch('https://api.github.com/repos/amasad/jfk_files/git/trees/main?recursive=1');
        const data = await response.json();
        const markdownFiles = data.tree
            .filter((file) => file.path.endsWith('.md'))
            .map((file) => file.path);
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const filePath of markdownFiles) {
                const content = await fetch(`https://raw.githubusercontent.com/amasad/jfk_files/main/${filePath}`)
                    .then(r => r.text());
                // Insert file metadata
                const fileResult = await client.query(`INSERT INTO files (file_path, title, content, url)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (file_path) DO UPDATE
           SET content = $3, updated_at = CURRENT_TIMESTAMP
           RETURNING id`, [
                    filePath,
                    filePath.split('/').pop() || filePath,
                    content,
                    `https://github.com/amasad/jfk_files/blob/main/${filePath}`
                ]);
                const fileId = fileResult.rows[0].id;
                // Process and insert chunks
                const processedChunks = await (0, textProcessing_1.processText)(content);
                console.log(`Generated ${processedChunks.length} chunks for file: ${filePath}`);
                for (const chunk of processedChunks) {
                    console.log(`Inserting chunk ${chunk.index} with embedding length:`, chunk.embedding.length);
                    await client.query(`INSERT INTO chunks (file_id, content, embedding, chunk_index)
             VALUES ($1, $2, $3::vector, $4)
             ON CONFLICT (file_id, chunk_index) DO UPDATE
             SET content = $2, embedding = $3::vector`, [
                        fileId,
                        chunk.content,
                        `[${chunk.embedding.join(',')}]`,
                        chunk.index
                    ]);
                }
            }
            await client.query('COMMIT');
            res.json({ message: 'Files initialized successfully' });
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Initialization error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
