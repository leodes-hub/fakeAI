import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import qaRoutes from './routes/qa.js';
import adminRoutes from './routes/admin.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'FakeAI API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Please check your configuration.');
            process.exit(1);
        }

        // Start listening
        app.listen(PORT, () => {
            console.log(`\n🚀 FakeAI Backend Server`);
            console.log(`📡 Server running on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`\n📚 API Endpoints:`);
            console.log(`   - POST   /api/auth/register`);
            console.log(`   - POST   /api/auth/login`);
            console.log(`   - GET    /api/auth/me`);
            console.log(`   - POST   /api/chat/message`);
            console.log(`   - GET    /api/qa`);
            console.log(`   - POST   /api/qa`);
            console.log(`   - PUT    /api/qa/:id`);
            console.log(`   - DELETE /api/qa/:id`);
            console.log(`   - GET    /api/admin/users`);
            console.log(`   - PUT    /api/admin/users/:id/activate`);
            console.log(`   - PUT    /api/admin/users/:id/deactivate`);
            console.log(`   - GET    /api/admin/stats`);
            console.log(`\n✅ Server ready to accept connections\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
