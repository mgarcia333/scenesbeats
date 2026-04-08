import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await axios.get(url);
    console.log("Available Models:");
    response.data.models.forEach(m => {
        console.log(`- ${m.name} (Supported: ${m.supportedGenerationMethods.join(', ')})`);
    });
  } catch (e) {
    console.error("List models failed:", e.response?.data || e.message);
  }
}

listModels();
