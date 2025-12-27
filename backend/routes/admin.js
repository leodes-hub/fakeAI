import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { query } from '../config/database.js';

const router = express.Router();

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await query(
            `SELECT id, email, name, role, is_active, created_at 
       FROM users 
       ORDER BY created_at DESC`
        );

        res.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Activate user (admin only)
router.put('/users/:id/activate', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const users = await query('SELECT id, email FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Activate user
        await query('UPDATE users SET is_active = TRUE WHERE id = ?', [id]);

        res.json({
            message: 'User activated successfully',
            userId: id,
            email: users[0].email
        });
    } catch (error) {
        console.error('Error activating user:', error);
        res.status(500).json({ error: 'Failed to activate user' });
    }
});

// Deactivate user (admin only)
router.put('/users/:id/deactivate', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deactivating themselves
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Cannot deactivate your own account' });
        }

        // Check if user exists
        const users = await query('SELECT id, email FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Deactivate user
        await query('UPDATE users SET is_active = FALSE WHERE id = ?', [id]);

        res.json({
            message: 'User deactivated successfully',
            userId: id,
            email: users[0].email
        });
    } catch (error) {
        console.error('Error deactivating user:', error);
        res.status(500).json({ error: 'Failed to deactivate user' });
    }
});

// Get system statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get total users
        const totalUsersResult = await query('SELECT COUNT(*) as count FROM users');
        const totalUsers = totalUsersResult[0].count;

        // Get active users
        const activeUsersResult = await query('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
        const activeUsers = activeUsersResult[0].count;

        // Get total Q&A pairs
        const totalQAResult = await query('SELECT COUNT(*) as count FROM qa_pairs');
        const totalQAPairs = totalQAResult[0].count;

        // Get Q&A pairs by language
        const qaByLanguage = await query(
            `SELECT language, COUNT(*) as count 
       FROM qa_pairs 
       GROUP BY language 
       ORDER BY count DESC`
        );

        res.json({
            stats: {
                totalUsers,
                activeUsers,
                inactiveUsers: totalUsers - activeUsers,
                totalQAPairs,
                qaByLanguage
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

export default router;
