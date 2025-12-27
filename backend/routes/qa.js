import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { getUserQAPairs } from '../services/matchingService.js';
import { detectLanguage } from '../services/geminiService.js';

const router = express.Router();

// Get all Q&A pairs for current user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const qaPairs = await getUserQAPairs(req.user.id);
        res.json({ qaPairs });
    } catch (error) {
        console.error('Error fetching Q&A pairs:', error);
        res.status(500).json({ error: 'Failed to fetch Q&A pairs' });
    }
});

// Create new Q&A pair
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { question, answer, language } = req.body;
        const userId = req.user.id;

        // Validation
        if (!question || !answer) {
            return res.status(400).json({ error: 'Question and answer are required' });
        }

        // Auto-detect language if not provided
        const detectedLanguage = language || detectLanguage(question);

        // Check if this exact question already exists for this user
        const existing = await query(
            'SELECT id FROM qa_pairs WHERE user_id = ? AND question = ?',
            [userId, question]
        );

        if (existing.length > 0) {
            // Update existing Q&A pair (latest answer wins)
            await query(
                'UPDATE qa_pairs SET answer = ?, language = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [answer, detectedLanguage, existing[0].id]
            );

            res.json({
                message: 'Q&A pair updated successfully',
                id: existing[0].id,
                question,
                answer,
                language: detectedLanguage
            });
        } else {
            // Insert new Q&A pair
            const result = await query(
                'INSERT INTO qa_pairs (user_id, question, answer, language) VALUES (?, ?, ?, ?)',
                [userId, question, answer, detectedLanguage]
            );

            res.status(201).json({
                message: 'Q&A pair created successfully',
                id: result.insertId,
                question,
                answer,
                language: detectedLanguage
            });
        }
    } catch (error) {
        console.error('Error creating Q&A pair:', error);
        res.status(500).json({ error: 'Failed to create Q&A pair' });
    }
});

// Update Q&A pair
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { question, answer, language } = req.body;
        const userId = req.user.id;

        // Validation
        if (!question || !answer) {
            return res.status(400).json({ error: 'Question and answer are required' });
        }

        // Check if Q&A pair exists and belongs to user
        const existing = await query(
            'SELECT id FROM qa_pairs WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Q&A pair not found' });
        }

        // Auto-detect language if not provided
        const detectedLanguage = language || detectLanguage(question);

        // Update Q&A pair
        await query(
            'UPDATE qa_pairs SET question = ?, answer = ?, language = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [question, answer, detectedLanguage, id]
        );

        res.json({
            message: 'Q&A pair updated successfully',
            id,
            question,
            answer,
            language: detectedLanguage
        });
    } catch (error) {
        console.error('Error updating Q&A pair:', error);
        res.status(500).json({ error: 'Failed to update Q&A pair' });
    }
});

// Delete Q&A pair
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if Q&A pair exists and belongs to user
        const existing = await query(
            'SELECT id FROM qa_pairs WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Q&A pair not found' });
        }

        // Delete Q&A pair
        await query('DELETE FROM qa_pairs WHERE id = ?', [id]);

        res.json({ message: 'Q&A pair deleted successfully' });
    } catch (error) {
        console.error('Error deleting Q&A pair:', error);
        res.status(500).json({ error: 'Failed to delete Q&A pair' });
    }
});

export default router;
