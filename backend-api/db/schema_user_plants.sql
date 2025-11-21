-- Table to store user's plant database
CREATE TABLE IF NOT EXISTS user_plants (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    plant_name VARCHAR(255) NOT NULL,
    variety VARCHAR(255),
    planted_date DATE,
    health_status ENUM('excellent','good','fair','needs attention','critical') DEFAULT 'good',
    image_url VARCHAR(512),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
