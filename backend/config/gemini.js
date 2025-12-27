import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the Gemini model
export function getGeminiModel() {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    // Using gemini-2.0-flash-exp - newest Gemini model (Dec 2024)
    // Alternative options:
    // - 'gemini-1.5-pro' for advanced reasoning
    // - 'gemini-1.5-flash' for faster responses
    return genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
}

export default genAI;
