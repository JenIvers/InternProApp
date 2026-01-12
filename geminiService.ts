
import { GoogleGenAI, Type } from "@google/genai";
import { ALL_COMPETENCIES } from "./constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function suggestCompetencies(activityDescription: string): Promise<string[]> {
  if (!process.env.API_KEY || !activityDescription) return [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the following internship activity description, identify which of the provided Bethel University competency IDs are most applicable. Return only the IDs as a JSON array of strings.
      
      Activity: "${activityDescription}"
      
      Available Competencies:
      ${ALL_COMPETENCIES.map(c => `${c.id}: ${c.title} - ${c.description}`).join('\n')}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (text) {
      const suggestedIds = JSON.parse(text) as string[];
      return suggestedIds.filter(id => ALL_COMPETENCIES.some(c => c.id === id));
    }
  } catch (error) {
    console.error("Gemini suggestion failed:", error);
  }
  return [];
}
