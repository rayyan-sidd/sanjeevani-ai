// src/lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure the API Key is read correctly
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ GEMINI ERROR: API Key is missing from .env.local");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// Using Gemini 2.5 Flash - The stable 2026 workhorse
const MODEL_NAME = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `
  You are 'Sanjeevani AI', a medical triage assistant for rural India. 
  
  CORE DIRECTIVES:
  1. START every response with: "⚠️ AI Assistant: Use the SOS button for emergencies."
  2. If symptoms like chest pain, heavy bleeding, or sudden paralysis are mentioned, STOP and say: "🚨 CRITICAL: Please press the SOS button immediately. Do not wait for AI advice."
  3. Keep language at a 5th-grade level. Use "Village-Simple" terms.
  4. Always provide a 'Next Step' (e.g., "Keep the wound clean" or "Consult a PHC doctor").
  5. Structure responses with: Disclaimer -> Summary -> Action Items -> Hindi Translation.
`;

export async function getChatResponse(userPrompt: string, history: any[]) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      systemInstruction: SYSTEM_INSTRUCTION 
    });

    const chat = model.startChat({
      history: history.length > 0 ? history : [],
    });

    const result = await chat.sendMessage(userPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
}

// Add this to src/lib/gemini.ts

export async function generateTriageSummary(history: any[]) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  // Flatten history for the prompt
  const chatContext = history.map(m => `${m.role}: ${m.text}`).join("\n");

  const prompt = `
    Analyze this patient-AI chat history and provide a "Doctor's Triage Summary".
    FORMAT: Exactly 3 short bullet points.
    FOCUS: Main symptom, duration/severity, and any red flags mentioned.
    
    CHAT HISTORY:
    ${chatContext}
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function getVisionResponse(prompt: string, imageBase64: string, mimeType: string) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
}