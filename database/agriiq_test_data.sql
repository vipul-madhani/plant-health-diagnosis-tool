-- ========================================
-- AgriIQ MySQL Database Schema & Test Data
-- ========================================
-- For Local Testing with PHPMyAdmin
-- Database: agriiq_db
-- ========================================

CREATE DATABASE IF NOT EXISTS agriiq_db;
USE agriiq_db;

-- ========================================
-- Table: users
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('farmer', 'agronomist', 'admin') DEFAULT 'farmer',
  region VARCHAR(50),
  is_online BOOLEAN DEFAULT FALSE,
  free_analyses_used INT DEFAULT 0,
  total_consultations INT DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========================================
-- Table: analyses
-- ========================================
CREATE TABLE IF NOT EXISTS analyses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  image_url VARCHAR(500),
  disease_detected VARCHAR(255),
  confidence_score DECIMAL(5,2),
  recommendations TEXT,
  status ENUM('pending', 'completed') DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ========================================
-- Table: consultations
-- ========================================
CREATE TABLE IF NOT EXISTS consultations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  agronomist_id INT,
  analysis_id INT,
  status ENUM('pending', 'assigned', 'in_progress', 'completed') DEFAULT 'pending',
  payment_status ENUM('pending', 'paid') DEFAULT 'pending',
  amount DECIMAL(10,2) DEFAULT 199.00,
  commission_platform DECIMAL(10,2) DEFAULT 59.70,
  commission_agronomist DECIMAL(10,2) DEFAULT 139.30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (farmer_id) REFERENCES users(id),
  FOREIGN KEY (agronomist_id) REFERENCES users(id),
  FOREIGN KEY (analysis_id) REFERENCES analyses(id)
);

-- ========================================
-- Table: chat_messages
-- ========================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  consultation_id INT NOT NULL,
  sender_id INT NOT NULL,
  message TEXT NOT NULL,
  is_ai_bot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consultation_id) REFERENCES consultations(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- ========================================
-- Table: payments
-- ========================================
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  consultation_id INT,
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('created', 'success', 'failed') DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (consultation_id) REFERENCES consultations(id)
);

-- ========================================
-- INSERT TEST DATA
-- ========================================

-- Test Users (Passwords are hashed with bcrypt: 'password123')
INSERT INTO users (email, password, name, phone, role, region, is_online, free_analyses_used) VALUES
('farmer1@test.com', '$2b$10$rKwE9K8mXZ6YqP8nH.vLn.5tF7xM3Qz9rVzP7wYxN2LmN5tF7xM3Q', 'Raj Kumar', '+919876543210', 'farmer', 'North', FALSE, 2),
('farmer2@test.com', '$2b$10$rKwE9K8mXZ6YqP8nH.vLn.5tF7xM3Qz9rVzP7wYxN2LmN5tF7xM3Q', 'Priya Sharma', '+919876543211', 'farmer', 'South', FALSE, 0),
('agronomist1@test.com', '$2b$10$rKwE9K8mXZ6YqP8nH.vLn.5tF7xM3Qz9rVzP7wYxN2LmN5tF7xM3Q', 'Dr. Amit Patel', '+919876543212', 'agronomist', 'West', TRUE, 0),
('agronomist2@test.com', '$2b$10$rKwE9K8mXZ6YqP8nH.vLn.5tF7xM3Qz9rVzP7wYxN2LmN5tF7xM3Q', 'Dr. Sunita Verma', '+919876543213', 'agronomist', 'East', FALSE, 0),
('admin@agriiq.com', '$2b$10$rKwE9K8mXZ6YqP8nH.vLn.5tF7xM3Qz9rVzP7wYxN2LmN5tF7xM3Q', 'Admin User', '+919876543214', 'admin', 'Central', TRUE, 0);

-- Test Analyses
INSERT INTO analyses (user_id, image_url, disease_detected, confidence_score, recommendations, status) VALUES
(1, '/uploads/test_leaf1.jpg', 'Leaf Blight', 87.50, 'Apply copper-based fungicide. Remove infected leaves immediately.', 'completed'),
(1, '/uploads/test_leaf2.jpg', 'Healthy Plant', 95.20, 'Plant appears healthy. Continue current care routine.', 'completed'),
(2, '/uploads/test_leaf3.jpg', 'Powdery Mildew', 82.30, 'Use neem oil spray. Improve air circulation around plants.', 'completed');

-- Test Consultations
INSERT INTO consultations (farmer_id, agronomist_id, analysis_id, status, payment_status, amount) VALUES
(1, 3, 1, 'completed', 'paid', 199.00),
(2, NULL, 3, 'pending', 'pending', 199.00);

-- Test Chat Messages
INSERT INTO chat_messages (consultation_id, sender_id, message, is_ai_bot) VALUES
(1, 1, 'Hello, I need help with my tomato plant', FALSE),
(1, 3, 'Hi! I can see the leaf blight issue. Let me help you with treatment.', FALSE),
(1, 3, 'First, remove all infected leaves and burn them.', FALSE),
(1, 1, 'Thank you! Should I use any spray?', FALSE),
(1, 3, 'Yes, use copper-based fungicide every 7 days for 3 weeks.', FALSE);

-- Test Payment
INSERT INTO payments (user_id, consultation_id, razorpay_order_id, razorpay_payment_id, amount, status) VALUES
(1, 1, 'order_test123', 'pay_test456', 199.00, 'success');

-- ========================================
-- INDEXES for Performance
-- ========================================
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_consultation_status ON consultations(status);
CREATE INDEX idx_consultation_farmer ON consultations(farmer_id);
CREATE INDEX idx_consultation_agronomist ON consultations(agronomist_id);

-- ========================================
-- TEST LOGIN CREDENTIALS
-- ========================================
-- Email: farmer1@test.com | Password: password123 | Role: Farmer
-- Email: farmer2@test.com | Password: password123 | Role: Farmer  
-- Email: agronomist1@test.com | Password: password123 | Role: Agronomist (ONLINE)
-- Email: agronomist2@test.com | Password: password123 | Role: Agronomist
-- Email: admin@agriiq.com | Password: password123 | Role: Admin

-- ========================================
-- USAGE INSTRUCTIONS
-- ========================================
-- 1. Import this file into PHPMyAdmin
-- 2. Database 'agriiq_db' will be created automatically
-- 3. All tables and test data will be populated
-- 4. Use the test credentials above to login
-- 5. Farmer1 has 2/3 free analyses used
-- 6. Agronomist1 is online and available
-- 7. One consultation is already completed for testing
