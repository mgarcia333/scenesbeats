import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function findModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await axios.get(url);
    const models = response.data.models;
    const generateModels = models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
    
    console.log("Found generateContent models:");
    generateModels.forEach(m => console.log(m.name.replace('models/', '')));
    
    if (generateModels.length > 0) {
        const bestModel = generateModels.find(m => m.name.includes('flash')) || generateModels[0];
        console.log("SUGGESTED_MODEL:" + bestModel.name.replace('models/', ''));
    }
  } catch (e) {
    console.error("Failed:", e.response?.data || e.message);
  }
}

findModel();
