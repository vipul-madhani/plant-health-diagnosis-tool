-- User sessions table for token management
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    refresh_token TEXT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    token_expiry DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- Admin moderation logs for audit trail
CREATE TABLE IF NOT EXISTS admin_moderation_logs (
    id TEXT PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for moderation logs
CREATE INDEX IF NOT EXISTS idx_moderation_logs_admin ON admin_moderation_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_entity ON admin_moderation_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_date ON admin_moderation_logs(created_at);
