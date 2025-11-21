-- Table for agronomist registrations, approval status, supporting files
CREATE TABLE IF NOT EXISTS agronomist_registrations (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    location_lat DOUBLE,
    location_long DOUBLE,
    bio TEXT,
    specializations TEXT,
    registration_type ENUM('certified','experience'),
    qualification VARCHAR(255),
    years_experience INT,
    experience_description TEXT,
    identity_proof_url VARCHAR(512),
    certification_url VARCHAR(512),
    photo_url VARCHAR(512),
    status ENUM('pending','verifying','approved','rejected','deleted') DEFAULT 'pending',
    admin_notes TEXT,
    ai_flags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified_at DATETIME,
    rejected_at DATETIME
);
