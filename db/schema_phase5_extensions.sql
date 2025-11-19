-- Phase 5: Expert Validation + B2B API Model
-- Schema extensions for agronomist marketplace, subscriptions, reports, and B2B API

-- TABLE 1: Agronomist Profiles
CREATE TABLE agronomists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    location_name VARCHAR(255),
    location_lat DECIMAL(10, 8),
    location_long DECIMAL(11, 8),
    specializations TEXT[] DEFAULT ARRAY[]::TEXT[],
    years_experience INT,
    bio TEXT,
    qualification VARCHAR(500),
    verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3, 2) DEFAULT 5.00,
    total_ratings INT DEFAULT 0,
    total_consultations INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_agronomist_location ON agronomists(location_lat, location_long);
CREATE INDEX idx_agronomist_rating ON agronomists(rating DESC);
CREATE INDEX idx_agronomist_status ON agronomists(status);
CREATE INDEX idx_agronomist_specializations ON agronomists USING GIN(specializations);

-- TABLE 2: Diagnostic Reports (99 INR AI-powered)
CREATE TABLE diagnostic_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    plant_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    image_secure_hash VARCHAR(255),
    ai_diagnosis JSONB NOT NULL,
    detailed_analysis JSONB NOT NULL,
    internet_sources TEXT[] DEFAULT ARRAY[]::TEXT[],
    community_tips_references UUID[] DEFAULT ARRAY[]::UUID[],
    report_status VARCHAR(20) DEFAULT 'completed' CHECK (report_status IN ('pending', 'completed', 'error')),
    price_inr INT DEFAULT 99,
    purchased_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plant_id) REFERENCES plant_species(id) ON DELETE SET NULL
);

CREATE INDEX idx_report_user ON diagnostic_reports(user_id);
CREATE INDEX idx_report_plant ON diagnostic_reports(plant_id);
CREATE INDEX idx_report_purchased ON diagnostic_reports(purchased_at DESC);

-- TABLE 3: Expert Consultations (FIFO Queue)
CREATE TABLE expert_consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    report_id UUID NOT NULL,
    request_type VARCHAR(20) DEFAULT 'chat' CHECK (request_type IN ('chat')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
    price_inr INT DEFAULT 299,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    completed_at TIMESTAMP,
    agronomist_id UUID,
    queue_position INT,
    user_location_lat DECIMAL(10, 8),
    user_location_long DECIMAL(11, 8),
    user_description TEXT,
    agronomist_notes TEXT,
    user_rating INT CHECK (user_rating BETWEEN 1 AND 5),
    agronomist_rating INT CHECK (agronomist_rating BETWEEN 1 AND 5),
    user_feedback TEXT,
    agronomist_feedback TEXT,
    cancelled_reason TEXT,
    cancelled_by VARCHAR(20) CHECK (cancelled_by IN ('user', 'agronomist', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (report_id) REFERENCES diagnostic_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (agronomist_id) REFERENCES agronomists(id) ON DELETE SET NULL
);

CREATE INDEX idx_consultation_status ON expert_consultations(status);
CREATE INDEX idx_consultation_queue ON expert_consultations(status, requested_at) WHERE status = 'pending';
CREATE INDEX idx_consultation_agronomist ON expert_consultations(agronomist_id, status);
CREATE INDEX idx_consultation_user ON expert_consultations(user_id);

-- TABLE 4: Agronomist Earnings & Payout Tracking
CREATE TABLE agronomist_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agronomist_id UUID NOT NULL,
    consultation_id UUID NOT NULL,
    earned_amount_inr INT NOT NULL,
    commission_percentage INT DEFAULT 70,
    payout_status VARCHAR(20) DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processed', 'paid', 'failed', 'cancelled')),
    payout_date TIMESTAMP,
    payout_method VARCHAR(50) CHECK (payout_method IN ('upi', 'bank_transfer', 'wallet')),
    payout_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agronomist_id) REFERENCES agronomists(id) ON DELETE CASCADE,
    FOREIGN KEY (consultation_id) REFERENCES expert_consultations(id) ON DELETE CASCADE
);

CREATE INDEX idx_earnings_agronomist ON agronomist_earnings(agronomist_id);
CREATE INDEX idx_earnings_payout_status ON agronomist_earnings(payout_status);
CREATE INDEX idx_earnings_pending ON agronomist_earnings(agronomist_id, payout_status) WHERE payout_status = 'pending';

-- TABLE 5: Premium Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    plan_type VARCHAR(50) DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'yearly')),
    price_inr INT DEFAULT 49,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
    billing_cycle_start_date DATE,
    next_billing_date DATE,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_subscription_status ON subscriptions(status);
CREATE INDEX idx_subscription_next_billing ON subscriptions(next_billing_date);

-- TABLE 6: In-app Chat Messages (for consultations)
CREATE TABLE consultation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    sender_role VARCHAR(20) CHECK (sender_role IN ('user', 'agronomist')),
    message_text TEXT NOT NULL,
    image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultation_id) REFERENCES expert_consultations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_consultation ON consultation_messages(consultation_id);
CREATE INDEX idx_chat_sender ON consultation_messages(sender_id);
CREATE INDEX idx_chat_unread ON consultation_messages(consultation_id, is_read) WHERE is_read = FALSE;

-- TABLE 7: B2B API Keys
CREATE TABLE b2b_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key VARCHAR(255) NOT NULL UNIQUE,
    api_secret VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    tier VARCHAR(20) DEFAULT 'tier1' CHECK (tier IN ('tier1', 'tier2', 'tier3')),
    requests_per_day INT DEFAULT 100,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_api_key ON b2b_api_keys(api_key);
CREATE INDEX idx_api_status ON b2b_api_keys(status);

-- TABLE 8: API Usage Logs (Rate Limiting & Billing)
CREATE TABLE api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status_code INT,
    request_count INT DEFAULT 1,
    response_time_ms INT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_hour TIMESTAMP DEFAULT DATE_TRUNC('hour', CURRENT_TIMESTAMP),
    FOREIGN KEY (api_key_id) REFERENCES b2b_api_keys(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_usage_key ON api_usage_logs(api_key_id);
CREATE INDEX idx_api_usage_date ON api_usage_logs(date_hour DESC);
CREATE INDEX idx_api_usage_key_date ON api_usage_logs(api_key_id, date_hour);

-- TABLE 9: Payment Transactions (Razorpay Integration)
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    transaction_type VARCHAR(50) CHECK (transaction_type IN ('report_purchase', 'consultation_booking', 'subscription')),
    amount_inr INT NOT NULL,
    currency VARCHAR(5) DEFAULT 'INR',
    razorpay_payment_id VARCHAR(255),
    razorpay_order_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'succeeded', 'failed', 'refunded')),
    refund_amount_inr INT,
    refund_reason TEXT,
    refund_date TIMESTAMP,
    related_report_id UUID,
    related_consultation_id UUID,
    related_subscription_id UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_report_id) REFERENCES diagnostic_reports(id) ON DELETE SET NULL,
    FOREIGN KEY (related_consultation_id) REFERENCES expert_consultations(id) ON DELETE SET NULL,
    FOREIGN KEY (related_subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);

CREATE INDEX idx_payment_user ON payment_transactions(user_id);
CREATE INDEX idx_payment_status ON payment_transactions(payment_status);
CREATE INDEX idx_payment_razorpay ON payment_transactions(razorpay_payment_id);
CREATE INDEX idx_payment_date ON payment_transactions(created_at DESC);

-- TABLE 10: Subscription History (Audit Trail)
CREATE TABLE subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL,
    action VARCHAR(50) CHECK (action IN ('created', 'renewed', 'downgraded', 'upgraded', 'cancelled', 'suspended')),
    previous_plan_type VARCHAR(50),
    new_plan_type VARCHAR(50),
    previous_price_inr INT,
    new_price_inr INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

CREATE INDEX idx_history_subscription ON subscription_history(subscription_id);

-- Add column to existing users table for agronomist profile link (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_agronomist BOOLEAN DEFAULT FALSE;
