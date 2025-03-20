import { app } from '../src/server';

// This is the serverless function entry point
export default async function handler(req: any, res: any) {
  try {
    const result = await app(req, res);
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
} 