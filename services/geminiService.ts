import { GoogleGenAI, Type } from "@google/genai";
import type { Puzzle } from '../types';

// Initialize the Google Gemini AI client
const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

const puzzleSchema = {
  type: Type.OBJECT,
  properties: {
    clue: {
      type: Type.STRING,
      description: 'The riddle or clue for the puzzle in Arabic.',
    },
    answer: {
      type: Type.STRING,
      description: 'The correct answer to the puzzle in Arabic.',
    },
    options: {
      type: Type.ARRAY,
      description: 'An array of 4 options in Arabic, one of which is the correct answer.',
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ['clue', 'answer', 'options'],
};

export const fetchPuzzles = async (count: number, seed?: number): Promise<Puzzle[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate ${count} unique and challenging puzzles in Arabic. The puzzles should be suitable for a general audience. For each puzzle, provide a clue, the correct answer, and 4 multiple-choice options (including the correct answer). Ensure the options are shuffled and that the correct answer is always one of the options.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            puzzles: {
              type: Type.ARRAY,
              description: `An array of exactly ${count} puzzle objects.`,
              items: puzzleSchema,
            },
          },
          required: ['puzzles'],
        },
        ...(seed && { seed }),
      },
    });

    const jsonString = response.text.trim();
    if (!jsonString) {
      console.error('Gemini response is empty.');
      return [];
    }

    const parsed = JSON.parse(jsonString);
    
    if (parsed.puzzles && Array.isArray(parsed.puzzles) && parsed.puzzles.length > 0) {
        // Validate that the parsed data matches the Puzzle interface
        const puzzles: Puzzle[] = parsed.puzzles.filter((p: any) => 
            p.clue && typeof p.clue === 'string' &&
            p.answer && typeof p.answer === 'string' &&
            p.options && Array.isArray(p.options) && p.options.length === 4 &&
            p.options.every((opt: any) => typeof opt === 'string') &&
            p.options.includes(p.answer)
        ).map((p: any) => ({
            clue: p.clue,
            answer: p.answer,
            options: p.options,
        }));

        if (puzzles.length === 0) {
          console.error('Parsed puzzles do not match expected schema.', parsed.puzzles);
          return [];
        }

        return puzzles.slice(0, count);
    }

    console.error('Failed to parse puzzles from Gemini response or puzzles array is empty:', parsed);
    return [];

  } catch (error) {
    console.error("Error fetching puzzles from Gemini API:", error);
    return [];
  }
};
