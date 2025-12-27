-- FakeAI Database Schema (MySQL)
-- This schema supports user authentication, Q&A pairs, and admin management

-- Create database
CREATE DATABASE IF NOT EXISTS fakeai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fakeai;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Q&A Pairs table (user-specific questions and answers)
CREATE TABLE IF NOT EXISTS qa_pairs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_language (language),
    INDEX idx_created_at (created_at),
    FULLTEXT INDEX idx_question (question)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create default admin user (password: admin123 - CHANGE THIS!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (email, name, password_hash, role, is_active) 
VALUES ('admin@fakeai.com', 'Admin User', '$2b$10$rKZWvVZ5qJ5YqJ5YqJ5YqOXxJ5YqJ5YqJ5YqJ5YqJ5YqJ5YqJ5Yqu', 'admin', TRUE)
ON DUPLICATE KEY UPDATE email=email;

-- Note: The above password hash is a placeholder. 
-- Run the following Node.js code to generate a proper hash:
-- const bcrypt = require('bcrypt');
-- bcrypt.hash('admin123', 10).then(hash => console.log(hash));
