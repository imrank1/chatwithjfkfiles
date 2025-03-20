import { app } from '../src/server';

// This is the serverless function entry point
export default async function handler(req: any, res: any) {
  return app(req, res);
} 