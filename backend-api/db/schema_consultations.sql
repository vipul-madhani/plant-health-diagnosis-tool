-- Consultations table - core consultation data
CREATE TABLE IF NOT EXISTS consultations (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    agronomist_id INTEGER NOT NULL,
    plant_image_url TEXT,
    description TEXT NOT NULL,
    region TEXT NOT NULL,
    season TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'diagnosed', 'completed'
    diagnosis TEXT,
    remedies TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    diagnosed_at DATETIME,
    ended_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (agronomist_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for consultation queries
CREATE INDEX IF NOT EXISTS idx_consultations_user ON consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_agronomist ON consultations(agronomist_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_created ON consultations(created_at);
CREATE INDEX IF NOT EXISTS idx_consultations_region_season ON consultations(region, season);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id TEXT PRIMARY KEY,
    agronomist_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    region TEXT,
    season TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'published'
    effectiveness_score REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agronomist_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for blog queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_agronomist ON blog_posts(agronomist_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_effectiveness ON blog_posts(effectiveness_score DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_region_season ON blog_posts(region, season);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created ON blog_posts(created_at);

-- Payout tracking table (collection-based, not immediate UPI)
CREATE TABLE IF NOT EXISTS payout_tracking (
    id TEXT PRIMARY KEY,
    agronomist_id INTEGER NOT NULL,
    consultation_id TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    commission_percentage REAL DEFAULT 70,
    status TEXT DEFAULT 'pending', -- 'pending', 'collected', 'paid_out'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    collected_at DATETIME,
    paid_out_at DATETIME,
    FOREIGN KEY (agronomist_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE SET NULL
);

-- Indexes for payout queries
CREATE INDEX IF NOT EXISTS idx_payout_agronomist ON payout_tracking(agronomist_id);
CREATE INDEX IF NOT EXISTS idx_payout_status ON payout_tracking(status);
CREATE INDEX IF NOT EXISTS idx_payout_created ON payout_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_payout_collected ON payout_tracking(collected_at);
