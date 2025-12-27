import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function initDatabase() {
    let connection;

    try {
        // First connect without database to create it
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });

        console.log('✅ Connected to MySQL server');

        // Read and execute schema
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('📝 Executing schema...');
        await connection.query(schema);

        console.log('✅ Database schema created successfully!');
        console.log('\n📊 Database: fakeai_db');
        console.log('📋 Tables created:');
        console.log('   - users');
        console.log('   - qa_pairs');
        console.log('\n👤 Default admin user created:');
        console.log('   Email: admin@fakeai.com');
        console.log('   Password: admin123 (CHANGE THIS!)');
        console.log('\n✅ Database initialization complete!');

    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

initDatabase();
