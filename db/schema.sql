-- Plant Health Diagnosis Tool - PostgreSQL Schema
-- This schema implements best practices for security, performance, and scalability

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- Users Table with Security
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  is_expert BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_tier);
CREATE INDEX idx_users_created ON users(created_at);

-- Plant Species Table
CREATE TABLE plant_species (
  id SERIAL PRIMARY KEY,
  scientific_name VARCHAR(255) UNIQUE NOT NULL,
  common_name VARCHAR(255) NOT NULL,
  family VARCHAR(100),
  description TEXT,
  growing_zones VARCHAR(50),
  water_requirements VARCHAR(100),
  sunlight_requirements VARCHAR(100),
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plant_species_common ON plant_species(common_name);
CREATE INDEX idx_plant_species_family ON plant_species(family);

-- Diseases Table
CREATE TABLE diseases (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  scientific_name VARCHAR(255),
  description TEXT,
  severity_level VARCHAR(50),
  fungal BOOLEAN DEFAULT FALSE,
  bacterial BOOLEAN DEFAULT FALSE,
  viral BOOLEAN DEFAULT FALSE,
  pest_related BOOLEAN DEFAULT FALSE,
  environmental BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_diseases_name ON diseases(name);
CREATE INDEX idx_diseases_severity ON diseases(severity_level);

-- Treatments Table with Performance Optimization
CREATE TABLE treatments (
  id SERIAL PRIMARY KEY,
  disease_id INTEGER NOT NULL REFERENCES diseases(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  dosage VARCHAR(100),
  application_frequency VARCHAR(100),
  effectiveness_percentage DECIMAL(5, 2),
  preparation_instructions TEXT,
  safety_precautions TEXT,
  cost_estimate_usd DECIMAL(10, 2),
  is_organic BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_treatments_disease ON treatments(disease_id);
CREATE INDEX idx_treatments_type ON treatments(type);
CREATE INDEX idx_treatments_organic ON treatments(is_organic) WHERE is_organic = TRUE;

-- Diagnoses Table with Encryption Fields
CREATE TABLE diagnoses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_hash VARCHAR(255) UNIQUE,
  plant_species_id INTEGER REFERENCES plant_species(id),
  plant_species_confidence DECIMAL(5, 4),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_address VARCHAR(255),
  raw_model_output BYTEA,
  user_feedback_rating INTEGER CHECK (user_feedback_rating >= 1 AND user_feedback_rating <= 5),
  user_feedback_text TEXT,
  is_validated_by_experts BOOLEAN DEFAULT FALSE,
  validation_count INTEGER DEFAULT 0,
  confidence_score DECIMAL(5, 4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_diagnoses_user ON diagnoses(user_id);
CREATE INDEX idx_diagnoses_created ON diagnoses(created_at DESC);
CREATE INDEX idx_diagnoses_location ON diagnoses(latitude, longitude);
CREATE INDEX idx_diagnoses_validated ON diagnoses(is_validated_by_experts) WHERE is_validated_by_experts = TRUE;
CREATE INDEX idx_diagnoses_species ON diagnoses(plant_species_id);

-- Diagnosis Diseases Junction Table
CREATE TABLE diagnosis_diseases (
  id SERIAL PRIMARY KEY,
  diagnosis_id UUID NOT NULL REFERENCES diagnoses(id) ON DELETE CASCADE,
  disease_id INTEGER NOT NULL REFERENCES diseases(id) ON DELETE CASCADE,
  confidence DECIMAL(5, 4),
  UNIQUE(diagnosis_id, disease_id)
);

CREATE INDEX idx_diagnosis_diseases_diagnosis ON diagnosis_diseases(diagnosis_id);
CREATE INDEX idx_diagnosis_diseases_disease ON diagnosis_diseases(disease_id);

-- Community Validations
CREATE TABLE community_validations (
  id SERIAL PRIMARY KEY,
  diagnosis_id UUID NOT NULL REFERENCES diagnoses(id) ON DELETE CASCADE,
  validator_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  validation_type VARCHAR(50),
  confidence_rating INTEGER CHECK (confidence_rating >= 1 AND confidence_rating <= 10),
  feedback_text TEXT,
  expert_review BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(diagnosis_id, validator_user_id)
);

CREATE INDEX idx_validations_diagnosis ON community_validations(diagnosis_id);
CREATE INDEX idx_validations_validator ON community_validations(validator_user_id);

-- Organic Solution Providers
CREATE TABLE organic_solution_providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  provider_type VARCHAR(100),
  service_radius_km DECIMAL(10, 2),
  rating DECIMAL(3, 2),
  review_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_providers_location ON organic_solution_providers(latitude, longitude);
CREATE INDEX idx_providers_verified ON organic_solution_providers(verified) WHERE verified = TRUE;
CREATE INDEX idx_providers_rating ON organic_solution_providers(rating DESC);

-- ML Model Versions
CREATE TABLE ml_model_versions (
  id SERIAL PRIMARY KEY,
  model_name VARCHAR(255),
  version VARCHAR(50),
  model_hash VARCHAR(255) UNIQUE,
  accuracy_percentage DECIMAL(5, 2),
  training_dataset_name VARCHAR(255),
  training_data_source VARCHAR(255),
  licensing_info TEXT,
  copyright_attribution TEXT,
  deployed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_model_versions_active ON ml_model_versions(is_active);
CREATE INDEX idx_model_versions_deployed ON ml_model_versions(deployed_at DESC);

-- API Usage Logs for Rate Limiting
CREATE TABLE api_usage_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10),
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_logs_user_created ON api_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_api_logs_endpoint ON api_usage_logs(endpoint, created_at DESC);
CREATE INDEX idx_api_logs_created ON api_usage_logs(created_at DESC);

-- User Preferences
CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(50) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  organic_only_recommendations BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Retention & Archival Table
CREATE TABLE diagnosis_archive (
  id UUID PRIMARY KEY,
  user_id INTEGER,
  diagnosis_data JSONB,
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_archive_user ON diagnosis_archive(user_id);
CREATE INDEX idx_archive_date ON diagnosis_archive(archived_at);

-- Performance: Materialized View for Popular Diseases
CREATE MATERIALIZED VIEW popular_diseases AS
SELECT d.id, d.name, COUNT(dd.diagnosis_id) as diagnosis_count
FROM diseases d
LEFT JOIN diagnosis_diseases dd ON d.id = dd.disease_id
GROUP BY d.id, d.name
ORDER BY diagnosis_count DESC;

CREATE INDEX idx_popular_diseases_count ON popular_diseases(diagnosis_count DESC);

-- Function for automatic user update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-update
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatments_timestamp BEFORE UPDATE ON treatments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnoses_timestamp BEFORE UPDATE ON diagnoses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (least privilege)
CREATE ROLE plant_app_user WITH LOGIN PASSWORD 'changeme';
GRANT CONNECT ON DATABASE plant_health TO plant_app_user;
GRANT USAGE ON SCHEMA public TO plant_app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO plant_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO plant_app_user;
