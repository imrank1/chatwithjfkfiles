import { AIProvider } from './aiProviders';

// Debug flag - set to true for verbose logging
const DEBUG = true;

const CHUNK_SIZE = 1000; // characters
const CHUNK_OVERLAP = 200; // characters

// Define the required embedding dimension for Mistral (1024) 
// OpenAI uses 1536 which causes incompatibility with our database
const REQUIRED_EMBEDDING_DIM = 1024;

export interface Chunk {
  content: string;
  embedding: number[];
  index: number;
}

export function splitIntoChunks(text: string): Chunk[] {
  if (DEBUG) console.log('Splitting text into chunks');
  const chunks: Chunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < text.length) {
    // Find the end of the chunk
    let endIndex = startIndex + CHUNK_SIZE;
    
    // If not at the end, try to break at a sentence
    if (endIndex < text.length) {
      const nextPeriod = text.indexOf('.', endIndex - 50);
      if (nextPeriod !== -1) {
        endIndex = nextPeriod + 1;
      }
    }

    // Extract the chunk
    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk) {
      chunks.push({
        content: chunk,
        embedding: [],
        index: chunkIndex,
      });
      chunkIndex++;
    }

    // Move to next chunk, accounting for overlap
    startIndex = endIndex - CHUNK_OVERLAP;
  }

  if (DEBUG) console.log(`Created ${chunks.length} chunks`);
  return chunks;
}

export async function generateEmbedding(text: string, aiProvider: AIProvider): Promise<number[]> {
  if (DEBUG) {
    console.log('PROVIDER CHECK: generateEmbedding called with:');
    console.log('- Provider type:', aiProvider ? aiProvider.constructor.name : 'UNDEFINED');
    console.log('- Provider methods:', aiProvider ? Object.getOwnPropertyNames(Object.getPrototypeOf(aiProvider)) : 'NONE');
    console.log('- Text length:', text.length);
  }
  
  if (!aiProvider) {
    console.error('ERROR: AIProvider is undefined in generateEmbedding');
    throw new Error('AIProvider is undefined in generateEmbedding');
  }
  
  try {
    if (DEBUG) console.log('Calling aiProvider.generateEmbedding...');
    const embedding = await aiProvider.generateEmbedding(text);
    if (DEBUG) console.log('Embedding generated successfully, length:', embedding.length);
    
    // CRITICAL: Validate embedding dimensions to detect incompatibility early
    if (embedding.length !== REQUIRED_EMBEDDING_DIM) {
      console.error(`DIMENSION MISMATCH ERROR: Generated embedding has ${embedding.length} dimensions, but database requires ${REQUIRED_EMBEDDING_DIM} dimensions`);
      console.error('This is likely because OpenAI is being used instead of Mistral');
      console.error('OpenAI produces 1536-dimensional embeddings, while Mistral produces 1024-dimensional embeddings');
      throw new Error(`Embedding dimension mismatch: ${embedding.length} vs required ${REQUIRED_EMBEDDING_DIM}`);
    }
    
    return embedding;
  } catch (error) {
    console.error('ERROR in generateEmbedding:', error);
    throw error;
  }
}

export async function processText(text: string, aiProvider: AIProvider): Promise<Chunk[]> {
  if (DEBUG) {
    console.log('PROVIDER CHECK: processText called with:');
    console.log('- Provider type:', aiProvider ? aiProvider.constructor.name : 'UNDEFINED');
    console.log('- Text length:', text.length);
  }
  
  if (!aiProvider) {
    console.error('ERROR: AIProvider is undefined in processText');
    throw new Error('AIProvider is undefined in processText');
  }
  
  const chunks = splitIntoChunks(text);
  const processedChunks: Chunk[] = [];

  for (let i = 0; i < chunks.length; i++) {
    if (DEBUG) console.log(`Processing chunk ${i+1}/${chunks.length}`);
    const embedding = await generateEmbedding(chunks[i].content, aiProvider);
    processedChunks.push({
      content: chunks[i].content,
      embedding: embedding,
      index: chunks[i].index,
    });
  }

  if (DEBUG) console.log(`Processed ${processedChunks.length} chunks with embeddings`);
  return processedChunks;
} 