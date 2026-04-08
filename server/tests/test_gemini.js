import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(modelName) {
  try {
    console.log(`Testing model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hola, dime quién eres");
    console.log(`Success ${modelName}:`, result.response.text().slice(0, 50));
  } catch (err) {
    console.error(`Error ${modelName}: status ${err.status} - ${err.message}`);
  }
}

async function run() {
  await testModel("gemini-2.5-flash");
  await testModel("gemini-1.5-flash");
  await testModel("gemini-2.0-flash");
}

run();
