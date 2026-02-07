
import { GoogleGenAI, Type } from "@google/genai";
import { GameData, QuestionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateIELTSExercise = async (): Promise<GameData> => {
  const questionTypes = Object.values(QuestionType);
  const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Generate a professional IELTS Academic Reading passage of approximately 1000 words. 
    The passage should be formal, academic, and divided into 8-12 distinct paragraphs. 
    Then, generate ONE high-quality IELTS reading question of type: "${randomType}".
    The question MUST have clear evidence in one or more specific paragraphs.
    
    Return the result in JSON format:
    {
      "passage": {
        "title": "A Compelling Academic Title",
        "paragraphs": ["Paragraph 1 content...", "Paragraph 2 content...", ...]
      },
      "question": {
        "type": "${randomType}",
        "questionText": "The specific question or statement to evaluate.",
        "correctParagraphIndices": [index_of_paragraph_starting_at_0],
        "explanation": "Detailed explanation in Vietnamese of why this paragraph contains the answer, including the specific keywords used.",
        "answer": "The actual answer to the question (e.g., 'True', 'B', or the filled gap word)."
      }
    }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          passage: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              paragraphs: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["title", "paragraphs"]
          },
          question: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              questionText: { type: Type.STRING },
              correctParagraphIndices: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER }
              },
              explanation: { type: Type.STRING },
              answer: { type: Type.STRING }
            },
            required: ["type", "questionText", "correctParagraphIndices", "explanation", "answer"]
          }
        },
        required: ["passage", "question"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text);
    return data as GameData;
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    throw new Error("Failed to generate exercise");
  }
};
