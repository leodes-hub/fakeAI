import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate a random verification token
export function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Send verification email
export async function sendVerificationEmail(email, name, token) {
    const verificationUrl = `${process.env.APP_URL}/api/auth/verify-email/${token}`;

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'FakeAI <noreply@resend.dev>',
            to: [email],
            subject: 'Verify your FakeAI account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #10a37f;">Welcome to FakeAI!</h1>
                    <p>Hi ${name},</p>
                    <p>Thank you for registering. Please click the button below to verify your email address:</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background-color: #10a37f; color: white; padding: 14px 28px; 
                                  text-decoration: none; border-radius: 8px; font-weight: bold;">
                            Verify Email
                        </a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
                    <p>This link will expire in 24 hours.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">
                        If you didn't create an account, you can safely ignore this email.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error('Email send error:', error);
            return false;
        }

        console.log('Verification email sent:', data?.id);
        return true;
    } catch (error) {
        console.error('Email service error:', error);
        return false;
    }
}

// Send password reset email
export async function sendPasswordResetEmail(email, name, token) {
    const resetUrl = `${process.env.APP_URL}/api/auth/reset-password-page/${token}`;

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'FakeAI <noreply@resend.dev>',
            to: [email],
            subject: 'Reset your FakeAI password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #10a37f;">Reset Your Password</h1>
                    <p>Hi ${name},</p>
                    <p>We received a request to reset your password. Click the button below to set a new password:</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #10a37f; color: white; padding: 14px 28px; 
                                  text-decoration: none; border-radius: 8px; font-weight: bold;">
                            Reset Password
                        </a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="color: #666; word-break: break-all;">${resetUrl}</p>
                    <p>This link will expire in 1 hour.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">
                        If you didn't request a password reset, you can safely ignore this email.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error('Email send error:', error);
            return false;
        }

        console.log('Password reset email sent:', data?.id);
        return true;
    } catch (error) {
        console.error('Email service error:', error);
        return false;
    }
}

export default { generateToken, sendVerificationEmail, sendPasswordResetEmail };
