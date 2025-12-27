import Fuse from 'fuse.js';
import { query } from '../config/database.js';

// Fuzzy matching configuration
const fuseOptions = {
    includeScore: true,
    threshold: 0.3, // 0.0 = perfect match, 1.0 = match anything (stricter matching)
    keys: ['question'],
    ignoreLocation: true,
    minMatchCharLength: 3
};

// Find matching Q&A pair for a user's question
export async function findMatchingAnswer(userId, question) {
    try {
        // Get all Q&A pairs for this user
        const qaPairs = await query(
            `SELECT id, question, answer, language, created_at 
       FROM qa_pairs 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
            [userId]
        );

        if (qaPairs.length === 0) {
            return null; // No Q&A pairs found for this user
        }

        // Use Fuse.js for fuzzy matching
        const fuse = new Fuse(qaPairs, fuseOptions);
        const results = fuse.search(question);

        if (results.length === 0) {
            return null; // No match found
        }

        // Get the best match (first result)
        const bestMatch = results[0];

        // If the match score is too low (score closer to 1 means worse match), return null
        // Stricter cutoff: only accept very good matches (score < 0.4)
        if (bestMatch.score > 0.4) {
            return null;
        }

        // Return the matched Q&A pair
        return {
            id: bestMatch.item.id,
            question: bestMatch.item.question,
            answer: bestMatch.item.answer,
            language: bestMatch.item.language,
            matchScore: bestMatch.score,
            source: 'database'
        };
    } catch (error) {
        console.error('Matching service error:', error);
        throw error;
    }
}

// Get all Q&A pairs for a user
export async function getUserQAPairs(userId) {
    try {
        const qaPairs = await query(
            `SELECT id, question, answer, language, created_at, updated_at 
       FROM qa_pairs 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
            [userId]
        );
        return qaPairs;
    } catch (error) {
        console.error('Error fetching Q&A pairs:', error);
        throw error;
    }
}
