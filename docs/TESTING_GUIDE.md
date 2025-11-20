# 🧪 COMPREHENSIVE TESTING GUIDE

**Plant Health Diagnosis Tool - Testing Documentation**

---

## 📋 TABLE OF CONTENTS

1. [Backend Testing (Python/Flask)](#backend-testing)
2. [Web Frontend Testing (React)](#web-frontend-testing)
3. [Mobile Frontend Testing (React Native)](#mobile-frontend-testing)
4. [End-to-End Testing (Cypress)](#e2e-testing)
5. [Critical Test Cases](#critical-test-cases)
6. [Running Tests](#running-tests)
7. [CI/CD Integration](#cicd-integration)

---

## 🐍 BACKEND TESTING

### Setup

```bash
cd backend-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install pytest pytest-cov pytest-flask pytest-mock
```

### Test Structure

```
backend-api/
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_consultation.py
│   ├── test_payout.py
│   └── test_ml_prediction.py
```

### Example: `tests/conftest.py`

```python
import pytest
from app import create_app
from database import db

@pytest.fixture
def app():
    app = create_app('testing')
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers(client):
    # Register and login a test user
    client.post('/api/auth/register', json={
        'email': 'test@example.com',
        'password': 'Test123!@#',
        'userType': 'farmer'
    })
    
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'Test123!@#'
    })
    
    token = response.json['token']
    return {'Authorization': f'Bearer {token}'}
```

### Example: `tests/test_auth.py`

```python
def test_register_farmer(client):
    response = client.post('/api/auth/register', json={
        'email': 'farmer@test.com',
        'password': 'Farmer123!@#',
        'userType': 'farmer',
        'name': 'Test Farmer'
    })
    
    assert response.status_code == 201
    assert 'token' in response.json
    assert response.json['user']['userType'] == 'farmer'

def test_register_agronomist(client):
    response = client.post('/api/auth/register', json={
        'email': 'agronomist@test.com',
        'password': 'Agro123!@#',
        'userType': 'agronomist',
        'name': 'Test Agronomist',
        'expertise': ['pest_management', 'soil_health']
    })
    
    assert response.status_code == 201
    assert response.json['user']['userType'] == 'agronomist'

def test_login_success(client):
    # First register
    client.post('/api/auth/register', json={
        'email': 'user@test.com',
        'password': 'User123!@#',
        'userType': 'farmer'
    })
    
    # Then login
    response = client.post('/api/auth/login', json={
        'email': 'user@test.com',
        'password': 'User123!@#'
    })
    
    assert response.status_code == 200
    assert 'token' in response.json
    assert 'refreshToken' in response.json

def test_login_invalid_credentials(client):
    response = client.post('/api/auth/login', json={
        'email': 'nonexistent@test.com',
        'password': 'WrongPassword123'
    })
    
    assert response.status_code == 401
    assert 'error' in response.json
```

### Example: `tests/test_consultation.py`

```python
def test_create_consultation_request(client, auth_headers):
    response = client.post('/api/consultations', 
        headers=auth_headers,
        json={
            'disease': 'leaf_blight',
            'cropType': 'wheat',
            'region': 'Maharashtra',
            'description': 'Yellowing leaves with brown spots',
            'images': ['image1.jpg', 'image2.jpg']
        }
    )
    
    assert response.status_code == 201
    assert response.json['status'] == 'pending'
    assert response.json['disease'] == 'leaf_blight'

def test_fifo_consultation_matching(client, auth_headers):
    # Create 3 consultation requests
    consult_ids = []
    for i in range(3):
        response = client.post('/api/consultations',
            headers=auth_headers,
            json={
                'disease': f'disease_{i}',
                'cropType': 'wheat',
                'region': 'Maharashtra'
            }
        )
        consult_ids.append(response.json['_id'])
    
    # Get next consultation (should be FIFO - first created)
    response = client.get('/api/consultations/next',
        headers=auth_headers
    )
    
    assert response.status_code == 200
    assert response.json['_id'] == consult_ids[0]

def test_30_70_commission_split(client, auth_headers):
    # Create and complete a consultation
    consult_response = client.post('/api/consultations',
        headers=auth_headers,
        json={
            'disease': 'leaf_blight',
            'cropType': 'wheat',
            'consultationFee': 100  # ₹100
        }
    )
    
    consult_id = consult_response.json['_id']
    
    # Complete consultation
    client.patch(f'/api/consultations/{consult_id}',
        headers=auth_headers,
        json={'status': 'completed'}
    )
    
    # Check commission split
    payout_response = client.get('/api/payouts/pending',
        headers=auth_headers
    )
    
    # Agronomist gets 70%
    assert payout_response.json['agronomistAmount'] == 70.0
    # Platform keeps 30%
    assert payout_response.json['platformAmount'] == 30.0
```

### Example: `tests/test_payout.py`

```python
def test_payout_collection_tracking(client, auth_headers):
    # Complete multiple consultations
    for i in range(3):
        consult_response = client.post('/api/consultations',
            headers=auth_headers,
            json={
                'disease': f'disease_{i}',
                'consultationFee': 100
            }
        )
        
        consult_id = consult_response.json['_id']
        client.patch(f'/api/consultations/{consult_id}',
            headers=auth_headers,
            json={'status': 'completed'}
        )
    
    # Check pending payouts
    response = client.get('/api/payouts/pending',
        headers=auth_headers
    )
    
    # Should have 3 consultations = ₹300 total, 70% = ₹210
    assert response.json['totalPending'] == 210.0
    assert response.json['collectionStatus'] == 'pending'
    assert len(response.json['consultationIds']) == 3

def test_payout_collection_status_change(client, auth_headers):
    # Simulate payout collection
    response = client.post('/api/payouts/collect',
        headers=auth_headers,
        json={
            'amount': 210.0,
            'consultationIds': ['id1', 'id2', 'id3']
        }
    )
    
    assert response.status_code == 200
    assert response.json['collectionStatus'] == 'collected'
    assert response.json['collectedAmount'] == 210.0
```

---

## ⚛️ WEB FRONTEND TESTING

### Setup

```bash
cd frontend-web
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Test Structure

```
frontend-web/
├── src/
│   ├── __tests__/
│   │   ├── components/
│   │   │   ├── BlogPage.test.js
│   │   │   ├── ProfilePage.test.js
│   │   │   └── ConsultationDetail.test.js
│   │   └── utils/
│   │       └── currency.test.js
```

### Example: `src/__tests__/components/BlogPage.test.js`

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import BlogPage from '../../pages/BlogPage';

test('filters posts by region', () => {
  render(<BlogPage />);
  
  // Select Maharashtra region
  const regionFilter = screen.getByLabelText('Region');
  fireEvent.change(regionFilter, { target: { value: 'Maharashtra' } });
  
  // Verify only Maharashtra posts are shown
  const posts = screen.getAllByTestId('blog-post');
  posts.forEach(post => {
    expect(post).toHaveTextContent('Maharashtra');
  });
});

test('shows only posts with 80%+ effectiveness', () => {
  render(<BlogPage />);
  
  const posts = screen.getAllByTestId('blog-post');
  posts.forEach(post => {
    const effectiveness = parseInt(post.getAttribute('data-effectiveness'));
    expect(effectiveness).toBeGreaterThanOrEqual(80);
  });
});
```

### Example: `src/__tests__/components/ProfilePage.test.js`

```javascript
import { render, screen } from '@testing-library/react';
import ProfilePage from '../../pages/ProfilePage';

test('displays INR currency correctly', () => {
  const mockProfile = {
    totalEarnings: 5000,
    pendingPayouts: 2100
  };
  
  render(<ProfilePage profile={mockProfile} />);
  
  // Check for INR symbol (₹)
  expect(screen.getByText(/₹5,000/)).toBeInTheDocument();
  expect(screen.getByText(/₹2,100/)).toBeInTheDocument();
});

test('shows collection status correctly', () => {
  const mockProfile = {
    collectionStatus: 'pending',
    consultations: [
      { id: '1', amount: 700, status: 'completed' },
      { id: '2', amount: 700, status: 'completed' },
      { id: '3', amount: 700, status: 'completed' }
    ]
  };
  
  render(<ProfilePage profile={mockProfile} />);
  
  expect(screen.getByText('Collection Status: Pending')).toBeInTheDocument();
  expect(screen.getByText('3 consultations ready')).toBeInTheDocument();
});
```

---

## 🎯 END-TO-END TESTING (CYPRESS)

### Setup

```bash
cd frontend-web
npm install --save-dev cypress
npx cypress open
```

### Example: `cypress/e2e/consultation_flow.cy.js`

```javascript
describe('Consultation Flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    
    // Login as farmer
    cy.get('[data-testid="email"]').type('farmer@test.com');
    cy.get('[data-testid="password"]').type('Test123!@#');
    cy.get('[data-testid="login-button"]').click();
  });
  
  it('creates consultation and verifies FIFO matching', () => {
    // Create consultation
    cy.get('[data-testid="new-consultation"]').click();
    cy.get('[data-testid="disease"]').select('leaf_blight');
    cy.get('[data-testid="crop-type"]').select('wheat');
    cy.get('[data-testid="region"]').select('Maharashtra');
    cy.get('[data-testid="description"]').type('Yellowing leaves');
    cy.get('[data-testid="submit"]').click();
    
    // Verify consultation created
    cy.contains('Consultation created successfully');
    
    // Login as agronomist
    cy.get('[data-testid="logout"]').click();
    cy.get('[data-testid="email"]').type('agronomist@test.com');
    cy.get('[data-testid="password"]').type('Test123!@#');
    cy.get('[data-testid="login-button"]').click();
    
    // Get next consultation (should be FIFO)
    cy.get('[data-testid="next-consultation"]').click();
    cy.contains('leaf_blight');
    cy.contains('wheat');
  });
  
  it('verifies 30-70 commission split and INR display', () => {
    // Complete a consultation with ₹100 fee
    cy.get('[data-testid="complete-consultation"]').click();
    
    // Go to profile
    cy.get('[data-testid="profile"]').click();
    
    // Verify agronomist gets 70% = ₹70
    cy.contains('₹70');
    cy.contains('Platform fee: ₹30');
  });
});
```

---

## 📱 MOBILE FRONTEND TESTING

### Setup

```bash
cd frontend-mobile
npm install --save-dev jest @testing-library/react-native
```

### Example: `__tests__/screens/ConsultationScreen.test.js`

```javascript
import { render, fireEvent } from '@testing-library/react-native';
import ConsultationScreen from '../screens/ConsultationScreen';

test('displays INR in mobile consultation', () => {
  const { getByText } = render(<ConsultationScreen />);
  
  expect(getByText(/₹100/)).toBeTruthy();
});
```

---

## ✅ CRITICAL TEST CASES

### Must-Test Business Logic

1. **FIFO Consultation Matching**
   - Verify oldest pending consultation is assigned first
   - Test with multiple pending consultations
   - Verify timestamp-based ordering

2. **30-70 Commission Split**
   - Test with various consultation fees (₹50, ₹100, ₹500)
   - Verify agronomist receives exactly 70%
   - Verify platform retains exactly 30%
   - Check decimal precision for odd amounts

3. **INR Currency Display**
   - All amounts must show ₹ symbol
   - Verify formatting: ₹1,000 (comma separation)
   - Test with zero amounts
   - Test with large amounts (₹10,00,000)

4. **Collection Status Tracking**
   - Test status changes: pending → collected → paid
   - Verify consultationIds array tracking
   - Test collection date recording
   - Verify total amount calculations

5. **80%+ Effectiveness Filter**
   - Verify blog posts below 80% are hidden
   - Test edge case at exactly 80%
   - Verify filter persists on page refresh

6. **Regional Filtering**
   - Test all regions (Maharashtra, Punjab, Karnataka, etc.)
   - Verify cross-region isolation
   - Test "All Regions" filter

7. **Email Notifications**
   - New consultation created → notify agronomists
   - Consultation completed → notify farmer
   - Payout ready → notify agronomist
   - Test email content formatting

---

## 🏃 RUNNING TESTS

### Backend Tests

```bash
cd backend-api
source venv/bin/activate

# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_consultation.py

# Run specific test
pytest tests/test_consultation.py::test_fifo_consultation_matching
```

### Web Frontend Tests

```bash
cd frontend-web

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test BlogPage.test.js

# Run in watch mode
npm test -- --watch
```

### E2E Tests

```bash
cd frontend-web

# Open Cypress UI
npx cypress open

# Run headless
npx cypress run

# Run specific spec
npx cypress run --spec "cypress/e2e/consultation_flow.cy.js"
```

### Mobile Tests

```bash
cd frontend-mobile

# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

---

## 🔄 CI/CD INTEGRATION

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.8'
      - name: Install dependencies
        run: |
          cd backend-api
          pip install -r requirements.txt
          pip install pytest pytest-cov
      - name: Run tests
        run: |
          cd backend-api
          pytest --cov=. --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v2

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: |
          cd frontend-web
          npm install
      - name: Run tests
        run: |
          cd frontend-web
          npm test -- --coverage
      - name: Run E2E tests
        run: |
          cd frontend-web
          npm start &
          npx wait-on http://localhost:3000
          npx cypress run
```

---

## 📊 TEST COVERAGE GOALS

- **Backend**: 80%+ coverage
- **Web Frontend**: 75%+ coverage
- **Mobile Frontend**: 70%+ coverage
- **E2E Tests**: Cover all critical user flows

---

## 📝 NOTES

1. All tests use INR currency (₹) - never USD ($)
2. FIFO matching is critical - test thoroughly
3. Commission split must be exactly 30-70
4. Collection status tracking must be precise
5. Email notifications are async - use mocks

---

**Generated**: November 20, 2025  
**Version**: 1.0.0  
**Maintainer**: Development Team
