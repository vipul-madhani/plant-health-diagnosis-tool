-- Chat messages table for consultation communication
CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    consultation_id TEXT NOT NULL,
    sender_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for message queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_consultation ON chat_messages(consultation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(consultation_id, is_read);

-- Blog engagement table for tracking effectiveness
CREATE TABLE IF NOT EXISTS blog_engagement (
    id TEXT PRIMARY KEY,
    blog_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    engagement_type TEXT NOT NULL, -- 'view', 'helpful', 'share'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blog_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for engagement queries
CREATE INDEX IF NOT EXISTS idx_blog_engagement_blog ON blog_engagement(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_engagement_user ON blog_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_engagement_type ON blog_engagement(blog_id, engagement_type);

-- Blog comments table
CREATE TABLE IF NOT EXISTS blog_comments (
    id TEXT PRIMARY KEY,
    blog_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blog_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for blog comments
CREATE INDEX IF NOT EXISTS idx_blog_comments_blog ON blog_comments(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user ON blog_comments(user_id);
