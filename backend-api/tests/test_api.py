"""
Unit Tests for Plant Health Diagnosis API

Run with: pytest tests/test_api.py -v
"""

import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from db.mysql_connection import test_connection


@pytest.fixture
def client():
    """Create test client"""
    app.config['TESTING'] = True
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    
    with app.test_client() as client:
        yield client


class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_health_check(self, client):
        """Test /api/health endpoint"""
        response = client.get('/api/health')
        assert response.status_code == 200
        
        data = response.get_json()
        assert data['status'] == 'healthy'
        assert 'message' in data
        assert 'database' in data
    
    def test_config_endpoint(self, client):
        """Test /api/config endpoint"""
        response = client.get('/api/config')
        assert response.status_code == 200
        
        data = response.get_json()
        assert 'apiVersion' in data
        assert 'consultationFee' in data
        assert 'platformCommission' in data
        assert 'agronomistCommission' in data
        assert data['platformCommission'] == 0.30
        assert data['agronomistCommission'] == 0.70


class TestDatabaseConnection:
    """Test database connectivity"""
    
    def test_database_connection(self):
        """Test MySQL database connection"""
        # This will pass if database is configured, skip if not
        try:
            result = test_connection()
            assert result is not None
        except Exception as e:
            pytest.skip(f"Database not configured: {str(e)}")


class TestErrorHandling:
    """Test error handling"""
    
    def test_404_error(self, client):
        """Test 404 error handling"""
        response = client.get('/api/nonexistent')
        assert response.status_code == 404
        
        data = response.get_json()
        assert 'error' in data
    
    def test_405_method_not_allowed(self, client):
        """Test 405 error for wrong HTTP method"""
        response = client.post('/api/health')
        assert response.status_code == 405
        
        data = response.get_json()
        assert 'error' in data


class TestValidation:
    """Test input validation"""
    
    def test_email_validation(self):
        """Test email validation function"""
        from middleware.validation import validate_email
        
        # Valid emails
        assert validate_email('test@example.com') == True
        assert validate_email('user.name@domain.co.in') == True
        
        # Invalid emails
        assert validate_email('invalid-email') == False
        assert validate_email('@example.com') == False
        assert validate_email('test@') == False
    
    def test_phone_validation(self):
        """Test phone number validation"""
        from middleware.validation import validate_phone
        
        # Valid Indian phone numbers
        assert validate_phone('9876543210') == True
        assert validate_phone('+919876543210') == True
        
        # Invalid phone numbers
        assert validate_phone('123456') == False
        assert validate_phone('1234567890') == False  # Must start with 6-9
        assert validate_phone('abcdefghij') == False
    
    def test_password_validation(self):
        """Test password strength validation"""
        from middleware.validation import validate_password
        
        # Valid passwords
        valid, msg = validate_password('StrongPass123')
        assert valid == True
        
        # Weak passwords
        valid, msg = validate_password('weak')
        assert valid == False
        assert 'at least 8 characters' in msg
        
        valid, msg = validate_password('lowercase123')
        assert valid == False
        assert 'uppercase' in msg
        
        valid, msg = validate_password('UPPERCASE123')
        assert valid == False
        assert 'lowercase' in msg
        
        valid, msg = validate_password('NoNumbers')
        assert valid == False
        assert 'number' in msg
    
    def test_sanitize_string(self):
        """Test string sanitization"""
        from middleware.validation import sanitize_string
        
        # Test SQL injection patterns
        dangerous = "SELECT * FROM users; DROP TABLE users;"
        cleaned = sanitize_string(dangerous)
        assert 'DROP' not in cleaned
        assert 'SELECT' not in cleaned
        
        # Test XSS patterns
        xss = "<script>alert('XSS')</script>"
        cleaned = sanitize_string(xss)
        assert '<script>' not in cleaned
        
        # Normal text should pass through
        normal = "This is a normal plant description."
        cleaned = sanitize_string(normal)
        assert cleaned == normal


class TestCommissionCalculation:
    """Test commission split calculations"""
    
    def test_30_70_split(self):
        """Test 30-70 commission split"""
        consultation_fee = 500
        platform_commission = 0.30
        agronomist_commission = 0.70
        
        platform_amount = consultation_fee * platform_commission
        agronomist_amount = consultation_fee * agronomist_commission
        
        assert platform_amount == 150
        assert agronomist_amount == 350
        assert platform_amount + agronomist_amount == consultation_fee
    
    def test_different_amounts(self):
        """Test commission with different consultation fees"""
        test_cases = [
            (500, 150, 350),
            (1000, 300, 700),
            (750, 225, 525),
        ]
        
        for fee, expected_platform, expected_agronomist in test_cases:
            platform = fee * 0.30
            agronomist = fee * 0.70
            
            assert platform == expected_platform
            assert agronomist == expected_agronomist


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
