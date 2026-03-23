import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const client = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY
});

async function listModels() {
  try {
    const models = await client.models.list();
    console.log('Available Models:', JSON.stringify(models, null, 2));
  } catch (err) {
    console.error('Error listing models:', err);
  }
}

listModels();
