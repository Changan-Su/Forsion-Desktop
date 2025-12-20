
import { GoogleGenAI } from "@google/genai";

// Forsion Assistant Gemini Service
export async function generateChatResponse(history: { role: string, content: string }[], message: string) {
  // Initialize AI client inside the function to ensure the latest API key from process.env.API_KEY is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // Use generateContent with model name and multi-turn contents array
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history.map(h => ({ 
          role: h.role === 'user' ? 'user' : 'model', 
          parts: [{ text: h.content }] 
        })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `You are Forsion Assistant, an AI agent inside the Forsion Desktop (a macOS-inspired productivity environment). 
        You help users manage knowledge, calendars, recipes, and tasks. 
        Your tone is professional, helpful, and creative, reflecting the "Muted Impressionist + Monet Cliffs" aesthetic of the OS.
        Be concise. Use markdown for lists and bold text.`
      }
    });

    // Extract text directly from the response object
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error: Unable to connect to the AI assistant. Please check your configuration.";
  }
}
