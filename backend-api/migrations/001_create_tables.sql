-- ========================================
-- Plant Health Diagnosis Tool
-- MySQL Database Migration Script
-- Version: 1.0
-- ========================================

-- Create database (run separately if needed)
-- CREATE DATABASE IF NOT EXISTS plant_health_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE plant_health_db;

-- ========================================
-- Table: users
-- ========================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(15) NULL,
  `role` ENUM('user', 'agronomist', 'admin') DEFAULT 'user' NOT NULL,
  `profilePicture` VARCHAR(500) NULL,
  `specialization` VARCHAR(200) NULL COMMENT 'For agronomists',
  `experience` INT NULL COMMENT 'Years of experience for agronomists',
  `certifications` TEXT NULL COMMENT 'JSON array of certifications',
  `region` ENUM('North', 'South', 'East', 'West', 'Central', 'Northeast') NULL,
  `totalEarned` DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  `pendingPayout` DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  `collectedPayout` DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  `isActive` BOOLEAN DEFAULT TRUE,
  `isVerified` BOOLEAN DEFAULT FALSE,
  `lastLoginAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`),
  INDEX `idx_region` (`region`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: analyses
-- ========================================
CREATE TABLE IF NOT EXISTS `analyses` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `imageUrl` VARCHAR(500) NOT NULL,
  `type` ENUM('basic', 'detailed') DEFAULT 'basic' NOT NULL,
  `diagnosis` VARCHAR(255) NOT NULL,
  `confidence` DECIMAL(5, 4) DEFAULT 0.0000 NOT NULL,
  `plantSpecies` VARCHAR(200) NULL,
  `quickTips` TEXT NULL,
  `mlModelVersion` VARCHAR(50) DEFAULT '1.0',
  `symptoms` JSON NULL COMMENT 'Array of symptom strings',
  `severity` ENUM('Low', 'Medium', 'High', 'Critical') NULL,
  `scientificName` VARCHAR(255) NULL,
  `family` VARCHAR(200) NULL,
  `treatmentPlan` JSON NULL COMMENT 'Object with immediate, shortTerm, longTerm',
  `organicRemedies` JSON NULL COMMENT 'Array of remedy objects',
  `preventionTips` JSON NULL COMMENT 'Array of prevention tip strings',
  `isPaid` BOOLEAN DEFAULT FALSE NOT NULL,
  `paymentId` INT NULL,
  `pdfPath` VARCHAR(500) NULL,
  `isDeleted` BOOLEAN DEFAULT FALSE,
  `deletedAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_type` (`type`),
  INDEX `idx_isPaid` (`isPaid`),
  INDEX `idx_isDeleted` (`isDeleted`),
  INDEX `idx_userId_createdAt` (`userId`, `createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: payments
-- ========================================
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `orderId` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Razorpay order ID',
  `razorpayPaymentId` VARCHAR(100) NULL COMMENT 'Razorpay payment ID',
  `type` ENUM('detailed_report', 'consultation') NOT NULL,
  `analysisId` INT NULL,
  `consultationId` INT NULL,
  `amount` DECIMAL(10, 2) NOT NULL COMMENT 'Amount in INR before GST',
  `gstAmount` DECIMAL(10, 2) NOT NULL COMMENT '18% GST amount',
  `totalAmount` DECIMAL(10, 2) NOT NULL COMMENT 'Total including GST',
  `currency` VARCHAR(3) DEFAULT 'INR',
  `status` ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending' NOT NULL,
  `failureReason` TEXT NULL,
  `completedAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`analysisId`) REFERENCES `analyses`(`id`) ON DELETE SET NULL,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_orderId` (`orderId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_type` (`type`),
  INDEX `idx_userId_createdAt` (`userId`, `createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: consultations
-- ========================================
CREATE TABLE IF NOT EXISTS `consultations` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `farmerId` INT NOT NULL,
  `agronomistId` INT NULL,
  `analysisId` INT NULL,
  `paymentId` INT NULL,
  `amount` DECIMAL(10, 2) NOT NULL COMMENT 'Consultation fee in INR',
  `status` ENUM('pending', 'active', 'completed', 'cancelled') DEFAULT 'pending' NOT NULL,
  `paymentStatus` ENUM('pending', 'collected') DEFAULT 'pending' NOT NULL COMMENT 'Collection status',
  `agronomistEarning` DECIMAL(10, 2) NULL COMMENT '70% of amount',
  `platformCommission` DECIMAL(10, 2) NULL COMMENT '30% of amount',
  `collectedAt` DATETIME NULL COMMENT 'When farmer marked as collected',
  `assignedAt` DATETIME NULL COMMENT 'FIFO assignment timestamp',
  `completedAt` DATETIME NULL,
  `lastMessageTime` DATETIME NULL,
  `unreadCount` INT DEFAULT 0,
  `plantImage` VARCHAR(500) NULL,
  `diagnosis` VARCHAR(255) NULL,
  `summary` TEXT NULL COMMENT 'Final consultation summary',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`farmerId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`agronomistId`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`analysisId`) REFERENCES `analyses`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE SET NULL,
  INDEX `idx_farmerId` (`farmerId`),
  INDEX `idx_agronomistId` (`agronomistId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_paymentStatus` (`paymentStatus`),
  INDEX `idx_createdAt` (`createdAt`),
  INDEX `idx_status_createdAt` (`status`, `createdAt`) COMMENT 'For FIFO queue'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: messages
-- ========================================
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `consultationId` INT NOT NULL,
  `senderId` INT NOT NULL,
  `senderRole` ENUM('user', 'agronomist') NOT NULL,
  `text` TEXT NOT NULL,
  `isRead` BOOLEAN DEFAULT FALSE,
  `readAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`consultationId`) REFERENCES `consultations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_consultationId` (`consultationId`),
  INDEX `idx_senderId` (`senderId`),
  INDEX `idx_consultationId_createdAt` (`consultationId`, `createdAt`),
  INDEX `idx_consultationId_isRead` (`consultationId`, `isRead`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Add foreign key for analyses.paymentId
-- (after payments table is created)
-- ========================================
ALTER TABLE `analyses`
  ADD FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE SET NULL;

-- ========================================
-- Insert default admin user (optional)
-- Password: admin123 (hashed with bcrypt)
-- ========================================
INSERT INTO `users` (`name`, `email`, `password`, `role`, `isActive`, `isVerified`, `createdAt`, `updatedAt`)
VALUES (
  'Admin User',
  'admin@planthelp.com',
  '$2a$10$X7qZ9QiZYJhXVKLwQwZjFOxYZ8vZmYqYZ8vZmYqYZ8vZmYqYZ8vZ',
  'admin',
  TRUE,
  TRUE,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE `email` = `email`;

-- ========================================
-- Database setup complete!
-- ========================================
