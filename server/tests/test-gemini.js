import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // There is no direct "listModels" in the standard client, 
    // but we can try a simple query to see if it works with a specific model.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("Gemini 1.5 Flash worked!");
  } catch (e) {
    console.error("Gemini 1.5 Flash failed:", e.message);
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent("test");
      console.log("Gemini Pro worked!");
    } catch (e2) {
      console.error("Gemini Pro failed:", e2.message);
    }
  }
}

listModels();
