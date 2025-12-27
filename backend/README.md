# FakeAI Backend Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

**Required Configuration:**
- `DB_PASSWORD`: Your MySQL root password
- `GEMINI_API_KEY`: Your Google Gemini API key (get it from https://makersuite.google.com/app/apikey)
- `JWT_SECRET`: A random secret string for JWT tokens

### 3. Initialize Database
```bash
node init-db.js
```

This will:
- Create the `fakeai_db` database
- Create `users` and `qa_pairs` tables
- Insert a default admin user (admin@fakeai.com / admin123)

### 4. Fix Admin Password
```bash
node fix-admin-password.js
```

This generates a proper bcrypt hash for the admin password.

### 5. Start Server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The server will run on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires auth)

### Chat
- `POST /api/chat/message` - Send message and get AI response (requires auth)

### Q&A Management
- `GET /api/qa` - Get all Q&A pairs (requires auth)
- `POST /api/qa` - Create Q&A pair (requires auth)
- `PUT /api/qa/:id` - Update Q&A pair (requires auth)
- `DELETE /api/qa/:id` - Delete Q&A pair (requires auth)

### Admin
- `GET /api/admin/users` - Get all users (requires admin)
- `PUT /api/admin/users/:id/activate` - Activate user (requires admin)
- `PUT /api/admin/users/:id/deactivate` - Deactivate user (requires admin)
- `GET /api/admin/stats` - Get statistics (requires admin)

## Default Credentials

**Admin User:**
- Email: admin@fakeai.com
- Password: admin123

⚠️ **IMPORTANT:** Change the admin password after first login!

## Troubleshooting

### Chat Returns "I couldn't process your question"
This means the Gemini API key is missing or invalid. Make sure:
1. You have a valid `GEMINI_API_KEY` in your `.env` file
2. Get a free API key from: https://makersuite.google.com/app/apikey
3. Restart the server after updating the `.env` file

### Database Connection Errors
- Verify MySQL is running
- Check `DB_PASSWORD` in `.env` matches your MySQL password
- Ensure the database user has proper permissions

### Login Returns 401
- Run `node fix-admin-password.js` to fix the admin password
- For new users, make sure they registered successfully
