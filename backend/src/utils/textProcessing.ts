import { AIProvider } from './aiProviders';

const CHUNK_SIZE = 1000; // characters
const CHUNK_OVERLAP = 200; // characters

export interface Chunk {
  content: string;
  embedding: number[];
  index: number;
}

export function splitIntoChunks(text: string): Chunk[] {
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

  return chunks;
}

export async function generateEmbedding(text: string, aiProvider: AIProvider): Promise<number[]> {
  console.log('Generating embedding for text:', text);
  try {
    return await aiProvider.generateEmbedding(text);
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

export async function processText(text: string, aiProvider: AIProvider): Promise<Chunk[]> {
  const chunks = splitIntoChunks(text);
  const processedChunks: Chunk[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i].content, aiProvider);
    processedChunks.push({
      content: chunks[i].content,
      embedding: embedding,
      index: chunks[i].index,
    });
  }

  return processedChunks;
} 