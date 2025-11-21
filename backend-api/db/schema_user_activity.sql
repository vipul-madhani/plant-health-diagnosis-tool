-- Table for user activity logs (for dashboard feed, analytics, push notifications)
CREATE TABLE IF NOT EXISTS user_activity_log (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    activity_type ENUM('diagnosis','consultation','payment','plant_added') NOT NULL,
    reference_id INTEGER,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
