
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function generateChatResponse(history: { role: string, content: string }[], message: string) {
  try {
    const chat = ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `You are Forsion Assistant, an AI agent inside the Forsion Desktop (a macOS-inspired productivity environment). 
        You help users manage knowledge, calendars, recipes, and tasks. 
        Your tone is professional, helpful, and creative, reflecting the "Muted Impressionist + Monet Cliffs" aesthetic of the OS.
        Be concise. Use markdown for lists and bold text.`
      }
    });

    const response = await chat;
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error: Unable to connect to the AI assistant. Please check your API key.";
  }
}