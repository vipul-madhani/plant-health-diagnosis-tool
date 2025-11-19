-- Knowledge Ecosystem Schema for AI-Powered Content Generation
-- Tables: Consultation data, ML training, auto-blogs, community, engagement

CREATE TABLE IF NOT EXISTS consultations_chat_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    consultation_id INT NOT NULL,
    agronomist_id INT NOT NULL,
    user_id INT NOT NULL,
    plant_type VARCHAR(100) NOT NULL,
    issue_category VARCHAR(100) NOT NULL,
    issue_severity ENUM('low', 'medium', 'high') DEFAULT 'medium',
    issue_description TEXT,
    messages JSON NOT NULL,
    solution_provided TEXT NOT NULL,
    solution_tags JSON,
    region VARCHAR(100),
    season VARCHAR(50),
    farm_type VARCHAR(50),
    farm_size_acres DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id),
    FOREIGN KEY (agronomist_id) REFERENCES agronomists(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_plant_issue (plant_type, issue_category),
    INDEX idx_region_season (region, season),
    INDEX idx_created (created_at)
);

CREATE TABLE IF NOT EXISTS consultation_feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    consultation_id INT NOT NULL,
    user_feedback_text TEXT,
    solution_worked ENUM('yes', 'no', 'partial') DEFAULT 'partial',
    effectiveness_percentage INT CHECK (effectiveness_percentage BETWEEN 0 AND 100),
    days_to_see_result INT,
    side_effects TEXT,
    would_recommend BOOLEAN,
    follow_up_needed BOOLEAN DEFAULT FALSE,
    user_tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id),
    INDEX idx_feedback_date (created_at),
    INDEX idx_effectiveness (effectiveness_percentage DESC)
);

CREATE TABLE IF NOT EXISTS knowledge_patterns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plant_type VARCHAR(100) NOT NULL,
    issue_category VARCHAR(100) NOT NULL,
    issue_description TEXT,
    solution_keyword VARCHAR(255) NOT NULL,
    solution_text TEXT,
    frequency_count INT DEFAULT 1,
    positive_outcomes INT DEFAULT 0,
    negative_outcomes INT DEFAULT 0,
    success_rate DECIMAL(5, 2),
    source_type ENUM('ai_diagnosis', 'consultation', 'community', 'research') DEFAULT 'consultation',
    supporting_evidence JSON,
    applicable_regions JSON,
    applicable_seasons JSON,
    farm_types JSON,
    confidence_level DECIMAL(3, 2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_pattern (plant_type, issue_category, solution_keyword),
    INDEX idx_success_rate (success_rate DESC),
    INDEX idx_plant_issue (plant_type, issue_category),
    INDEX idx_confidence (confidence_level DESC)
);

CREATE TABLE IF NOT EXISTS auto_generated_blogs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    content LONGTEXT NOT NULL,
    summary TEXT,
    pattern_id INT NOT NULL,
    plant_type VARCHAR(100),
    issue_category VARCHAR(100),
    success_rate DECIMAL(5, 2),
    supporting_consultations INT,
    auto_generated BOOLEAN DEFAULT TRUE,
    admin_verified BOOLEAN DEFAULT FALSE,
    admin_review_notes TEXT,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    view_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    unhelpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pattern_id) REFERENCES knowledge_patterns(id),
    INDEX idx_status_plant (status, plant_type),
    INDEX idx_published_date (published_at DESC),
    FULLTEXT INDEX ft_content (title, content, summary)
);

CREATE TABLE IF NOT EXISTS community_contributions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    contributor_id INT NOT NULL,
    contributor_type ENUM('user', 'agronomist', 'admin') NOT NULL,
    contribution_type ENUM('tip', 'blog_edit', 'feedback', 'validation', 'story') NOT NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    plant_type VARCHAR(100),
    issue_category VARCHAR(100),
    related_consultation_id INT,
    related_blog_id INT,
    status ENUM('submitted', 'approved', 'rejected', 'in_review') DEFAULT 'in_review',
    upvote_count INT DEFAULT 0,
    downvote_count INT DEFAULT 0,
    reviewer_id INT,
    review_notes TEXT,
    contributor_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status_type (status, contribution_type),
    INDEX idx_contributor (contributor_id, contributor_type),
    INDEX idx_plant_issue (plant_type, issue_category),
    INDEX idx_created (created_at DESC)
);

CREATE TABLE IF NOT EXISTS community_badges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    badge_type ENUM('expert_verified', 'top_contributor', 'helpful_guide', 'community_champion') NOT NULL,
    badge_name VARCHAR(100),
    badge_description TEXT,
    earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    earned_reason TEXT,
    UNIQUE KEY unique_user_badge (user_id, badge_type),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_badge_type (badge_type)
);

CREATE TABLE IF NOT EXISTS ml_model_training_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    model_version VARCHAR(20) NOT NULL,
    training_start_time TIMESTAMP,
    training_end_time TIMESTAMP,
    total_consultations_used INT,
    training_accuracy DECIMAL(5, 2),
    validation_accuracy DECIMAL(5, 2),
    patterns_learned INT,
    new_patterns_discovered INT,
    status ENUM('training', 'completed', 'deployed', 'archived') DEFAULT 'training',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_version (model_version),
    INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS content_engagement (
    id INT PRIMARY KEY AUTO_INCREMENT,
    blog_id INT NOT NULL,
    user_id INT,
    engagement_type ENUM('view', 'click', 'share', 'save', 'comment') NOT NULL,
    engagement_duration_seconds INT,
    device_type VARCHAR(50),
    region VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blog_id) REFERENCES auto_generated_blogs(id),
    INDEX idx_blog_date (blog_id, timestamp),
    INDEX idx_engagement_type (engagement_type)
);

CREATE TABLE IF NOT EXISTS feedback_collection_schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    consultation_id INT NOT NULL,
    first_feedback_due TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    second_feedback_due TIMESTAMP,
    third_feedback_due TIMESTAMP,
    first_feedback_sent BOOLEAN DEFAULT FALSE,
    second_feedback_sent BOOLEAN DEFAULT FALSE,
    third_feedback_sent BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id),
    UNIQUE KEY unique_consultation (consultation_id),
    INDEX idx_due_date (first_feedback_due)
);
