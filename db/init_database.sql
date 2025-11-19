-- Initialize sample data for Plant Health Diagnosis Tool

-- Insert sample plant species
INSERT INTO plant_species (scientific_name, common_name, family, description, growing_zones, water_requirements, sunlight_requirements) VALUES
('Solanum lycopersicum', 'Tomato', 'Solanaceae', 'Popular garden vegetable', '2-11', 'Regular watering', 'Full sun'),
('Solanum capsicum', 'Bell Pepper', 'Solanaceae', 'Colorful vegetable crop', '2-11', 'Moderate watering', 'Full sun'),
('Lactuca sativa', 'Lettuce', 'Asteraceae', 'Leafy green vegetable', '3-9', 'Consistent moisture', 'Partial shade to full sun');

-- Insert sample diseases
INSERT INTO diseases (name, scientific_name, description, severity_level, fungal, bacterial, viral) VALUES
('Early Blight', 'Alternaria solani', 'Fungal disease causing brown spots on tomato leaves', 'high', TRUE, FALSE, FALSE),
('Late Blight', 'Phytophthora infestans', 'Water-related fungal disease', 'critical', TRUE, FALSE, FALSE),
('Septoria Leaf Spot', 'Septoria lycopersici', 'Small circular spots with dark borders', 'medium', TRUE, FALSE, FALSE),
('Powdery Mildew', 'Erysiphe cichoracearum', 'White powdery coating on leaves', 'medium', TRUE, FALSE, FALSE);

-- Insert sample treatments
INSERT INTO treatments (disease_id, name, type, dosage, application_frequency, effectiveness_percentage, is_organic) VALUES
(1, 'Copper Fungicide', 'organic', '2-3 tbsp per gallon', 'Every 7-10 days', 85.00, TRUE),
(1, 'Mancozeb', 'chemical', '1.5 tbsp per gallon', 'Every 10-14 days', 90.00, FALSE),
(2, 'Potassium Phosphite', 'organic', '1 tbsp per gallon', 'Every 7-10 days', 80.00, TRUE),
(2, 'Metalaxyl + Copper', 'chemical', 'Follow label', 'Every 7 days', 95.00, FALSE),
(3, 'Sulphur', 'organic', '2-3 tbsp per gallon', 'Every 10 days', 75.00, TRUE),
(4, 'Neem Oil', 'organic', '1-2% solution', 'Weekly', 70.00, TRUE);

-- Insert ML model versions
INSERT INTO ml_model_versions (model_name, version, model_hash, accuracy_percentage, training_dataset_name, training_data_source, is_active) VALUES
('ResNet50-PlantDisease-v1', '1.0.0', 'abc123def456ghi789jkl', 92.50, 'PlantVillage 2024 Combined', 'PlantVillage + Local Dataset', TRUE),
('ResNet50-PlantDisease-v0.9', '0.9.0', 'xyz789abc456def123ghi', 89.30, 'PlantVillage 2023', 'PlantVillage Only', FALSE);

-- Insert sample organic providers
INSERT INTO organic_solution_providers (name, latitude, longitude, address, phone, email, website, provider_type, service_radius_km, verified, rating) VALUES
('Green Leaf Organic Farm', 40.7128, -74.0060, '123 Farm Road, New York, NY 10001', '+1-555-0101', 'contact@greenleaf.org', 'www.greenleaforganic.com', 'farmer_co_op', 15.0, TRUE, 4.8),
('Sustainable Agriculture Co-op', 40.7580, -73.9855, '456 Eco Lane, New York, NY 10002', '+1-555-0102', 'info@sustagri.org', 'www.sustagri.org', 'farmer_co_op', 20.0, TRUE, 4.6),
('Organic Pest Solutions', 40.7489, -73.9680, '789 Nature Blvd, New York, NY 10003', '+1-555-0103', 'solutions@organicpest.com', 'www.organicpest.com', 'organic_distributor', 25.0, TRUE, 4.5);

-- Test data for a sample user (create with application, not SQL)
-- Note: Password hashes should be bcrypted, never plain text
-- INSERT INTO users (email, password_hash, first_name, last_name) VALUES
-- ('farmer@example.com', 'hashed_password_here', 'John', 'Farmer');

COMMIT;
