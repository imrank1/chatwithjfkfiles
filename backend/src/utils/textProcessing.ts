import dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';

const CHUNK_SIZE = 1000; // characters
const CHUNK_OVERLAP = 200; // characters

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function generateEmbedding(text: string): Promise<number[]> {
  console.log('Generating embedding for text:', text);
  try {
    const response = await openai.embeddings.create({
      input: text,
      model: "text-embedding-ada-002"
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

export async function processText(text: string): Promise<Chunk[]> {
  const chunks = splitIntoChunks(text);
  const processedChunks: Chunk[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i].content);
    processedChunks.push({
      content: chunks[i].content,
      embedding: embedding,
      index: chunks[i].index,
    });
  }

  return processedChunks;
} 