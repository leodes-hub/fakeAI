import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/database.js';
import { generateToken } from '../utils/jwt.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateToken as generateEmailToken, sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUsers = await query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = generateEmailToken();
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Insert user with email_verified = false
        const result = await query(
            `INSERT INTO users (email, password_hash, name, role, email_verified, verification_token, verification_token_expires) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [email, passwordHash, name, 'user', false, verificationToken, tokenExpires]
        );

        // Send verification email
        const emailSent = await sendVerificationEmail(email, name, verificationToken);

        res.status(201).json({
            message: emailSent
                ? 'Registration successful! Please check your email to verify your account.'
                : 'Registration successful! Email verification pending.',
            requiresVerification: true,
            user: {
                id: result.insertId,
                email,
                name,
                role: 'user'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Verify email
router.get('/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Find user with this token
        const users = await query(
            `SELECT id, email, name, verification_token_expires FROM users 
             WHERE verification_token = ? AND email_verified = FALSE`,
            [token]
        );

        if (users.length === 0) {
            return res.status(400).send(`
                <html>
                    <body style="font-family: Arial; text-align: center; padding: 50px;">
                        <h1 style="color: #ef4444;">Invalid or Expired Link</h1>
                        <p>This verification link is invalid or has already been used.</p>
                    </body>
                </html>
            `);
        }

        const user = users[0];

        // Check if token expired
        if (new Date(user.verification_token_expires) < new Date()) {
            return res.status(400).send(`
                <html>
                    <body style="font-family: Arial; text-align: center; padding: 50px;">
                        <h1 style="color: #ef4444;">Link Expired</h1>
                        <p>This verification link has expired. Please register again.</p>
                    </body>
                </html>
            `);
        }

        // Update user as verified
        await query(
            `UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = ?`,
            [user.id]
        );

        res.send(`
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px; background: #0f0f0f; color: white;">
                    <h1 style="color: #10a37f;">✅ Email Verified!</h1>
                    <p>Your email has been verified successfully.</p>
                    <p>You can now log in to the FakeAI app.</p>
                </body>
            </html>
        `);
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).send('Verification failed');
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get user
        const users = await query(
            'SELECT id, email, password_hash, name, role, is_active, email_verified FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated. Please contact administrator.' });
        }

        // Check if email is verified
        if (!user.email_verified) {
            return res.status(403).json({ error: 'Please verify your email before logging in. Check your inbox.' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken({ userId: user.id });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Forgot password - request reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Find user
        const users = await query(
            'SELECT id, name, email FROM users WHERE email = ?',
            [email]
        );

        // Always return success (don't reveal if email exists)
        if (users.length === 0) {
            return res.json({ message: 'If this email exists, a reset link has been sent.' });
        }

        const user = users[0];

        // Generate reset token
        const resetToken = generateEmailToken();
        const tokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save token
        await query(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
            [resetToken, tokenExpires, user.id]
        );

        // Send email
        await sendPasswordResetEmail(user.email, user.name, resetToken);

        res.json({ message: 'If this email exists, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// Reset password page (shows form)
router.get('/reset-password-page/:token', async (req, res) => {
    const { token } = req.params;

    res.send(`
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Arial; background: #0f0f0f; color: white; padding: 20px; }
                    .container { max-width: 400px; margin: 50px auto; }
                    input { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #333; background: #1a1a1a; color: white; box-sizing: border-box; }
                    button { width: 100%; padding: 14px; background: #10a37f; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
                    button:hover { background: #0e8c6b; }
                    .error { color: #ef4444; margin: 10px 0; }
                    .success { color: #10a37f; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Reset Password</h1>
                    <form id="resetForm">
                        <input type="password" id="password" placeholder="New Password (min 6 chars)" required minlength="6">
                        <input type="password" id="confirmPassword" placeholder="Confirm Password" required>
                        <div id="message"></div>
                        <button type="submit">Reset Password</button>
                    </form>
                </div>
                <script>
                    document.getElementById('resetForm').onsubmit = async (e) => {
                        e.preventDefault();
                        const password = document.getElementById('password').value;
                        const confirmPassword = document.getElementById('confirmPassword').value;
                        const messageEl = document.getElementById('message');
                        
                        if (password !== confirmPassword) {
                            messageEl.className = 'error';
                            messageEl.textContent = 'Passwords do not match';
                            return;
                        }
                        
                        try {
                            const res = await fetch('/api/auth/reset-password', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ token: '${token}', password })
                            });
                            const data = await res.json();
                            
                            if (res.ok) {
                                messageEl.className = 'success';
                                messageEl.textContent = 'Password reset successful! You can now log in.';
                                document.getElementById('resetForm').style.display = 'none';
                            } else {
                                messageEl.className = 'error';
                                messageEl.textContent = data.error || 'Reset failed';
                            }
                        } catch (err) {
                            messageEl.className = 'error';
                            messageEl.textContent = 'An error occurred';
                        }
                    };
                </script>
            </body>
        </html>
    `);
});

// Reset password (process reset)
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Token and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Find user with valid token
        const users = await query(
            'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset link' });
        }

        const user = users[0];

        // Hash new password
        const passwordHash = await bcrypt.hash(password, 10);

        // Update password and clear token
        await query(
            'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL, email_verified = TRUE WHERE id = ?',
            [passwordHash, user.id]
        );

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Password reset failed' });
    }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const users = await query(
            'SELECT id, name, email_verified FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.json({ message: 'If this email exists, a verification link has been sent.' });
        }

        const user = users[0];

        if (user.email_verified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }

        // Generate new token
        const verificationToken = generateEmailToken();
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await query(
            'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
            [verificationToken, tokenExpires, user.id]
        );

        await sendVerificationEmail(email, user.name, verificationToken);

        res.json({ message: 'Verification email sent. Please check your inbox.' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Failed to resend verification email' });
    }
});

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
    res.json({
        user: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role
        }
    });
});

// Google OAuth - Sign in with Google
router.post('/google', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ error: 'Google ID token is required' });
        }

        // Verify the Google ID token
        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (verifyError) {
            console.error('Google token verification failed:', verifyError);
            return res.status(401).json({ error: 'Invalid Google token' });
        }

        const { sub: googleId, email, name, picture } = payload;

        if (!email) {
            return res.status(400).json({ error: 'Email not provided by Google' });
        }

        // Check if user exists by google_id or email
        let users = await query(
            'SELECT id, email, name, role, is_active, google_id FROM users WHERE google_id = ? OR email = ?',
            [googleId, email]
        );

        let user;
        let isNewUser = false;

        if (users.length === 0) {
            // Create new user with Google
            const result = await query(
                `INSERT INTO users (email, name, role, google_id, email_verified, is_active) 
                 VALUES (?, ?, ?, ?, TRUE, TRUE)`,
                [email, name, 'user', googleId]
            );

            user = {
                id: result.insertId,
                email,
                name,
                role: 'user'
            };
            isNewUser = true;
        } else {
            user = users[0];

            // Check if user is active
            if (!user.is_active) {
                return res.status(403).json({ error: 'Account is deactivated. Please contact administrator.' });
            }

            // If user exists by email but doesn't have google_id, link it
            if (!user.google_id) {
                await query(
                    'UPDATE users SET google_id = ?, email_verified = TRUE WHERE id = ?',
                    [googleId, user.id]
                );
            }
        }

        // Generate JWT token
        const token = generateToken({ userId: user.id });

        res.json({
            message: isNewUser ? 'Account created with Google' : 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email || email,
                name: user.name || name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Google OAuth error:', error);
        res.status(500).json({ error: 'Google authentication failed' });
    }
});

export default router;
