import { getGeminiModel } from '../config/gemini.js';

// Generate response using Gemini AI
export async function generateGeminiResponse(question) {
    try {
        const model = getGeminiModel();

        // Generate content
        const result = await model.generateContent(question);
        const response = await result.response;
        const text = response.text();

        return {
            success: true,
            answer: text,
            source: 'gemini'
        };
    } catch (error) {
        console.error('Gemini API error:', error);

        // Return a friendly error message
        return {
            success: false,
            answer: "I'm sorry, I couldn't process your question at the moment. Please try again later.",
            source: 'error',
            error: error.message
        };
    }
}

// Detect language from text (basic implementation)
export function detectLanguage(text) {
    // This is a simple heuristic - in production, you might want to use a proper language detection library
    const patterns = {
        en: /^[a-zA-Z\s\d\p{P}]+$/u,
        es: /[áéíóúñ¿¡]/i,
        fr: /[àâäæçéèêëïîôùûüÿœ]/i,
        de: /[äöüß]/i,
        ru: /[а-яА-ЯёЁ]/,
        ar: /[\u0600-\u06FF]/,
        zh: /[\u4E00-\u9FFF]/,
        ja: /[\u3040-\u309F\u30A0-\u30FF]/,
        ko: /[\uAC00-\uD7AF]/
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
        if (pattern.test(text)) {
            return lang;
        }
    }

    return 'en'; // Default to English
}
