import bcrypt from 'bcrypt';
import { query } from './config/database.js';

async function fixAdminPassword() {
    try {
        // Generate proper hash for 'admin123'
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);

        console.log('Generated password hash for admin123');

        // Update admin user
        await query(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [hash, 'admin@fakeai.com']
        );

        console.log('✅ Admin password updated successfully!');
        console.log('\n👤 Admin credentials:');
        console.log('   Email: admin@fakeai.com');
        console.log('   Password: admin123');
        console.log('\n⚠️  Please change this password after first login!');

    } catch (error) {
        console.error('❌ Error updating admin password:', error.message);
        process.exit(1);
    }
    process.exit(0);
}

fixAdminPassword();
