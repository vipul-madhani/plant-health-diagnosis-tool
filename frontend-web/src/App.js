import React, { useState } from 'react';
import './styles/index.css';
import DiagnosisPage from './pages/DiagnosisPage';
import ResultsPage from './pages/ResultsPage';

/**
 * Main Application Component
 * Plant Health Diagnosis Tool - React Frontend
 * 
 * Features:
 * - Image upload and processing
 * - Real-time disease diagnosis
 * - Plant species identification
 * - Results visualization with confidence scores
 * - Geo-aware solutions and recommendations
 */
function App() {
  const [currentPage, setCurrentPage] = useState('diagnosis');
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handle diagnosis submission
   * @param {File} image - Image file from upload
   */
  const handleDiagnosis = async (image) => {
    setLoading(true);
    setError(null);
    setUploadedImage(image);

    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('image', image);

      // Call backend API
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/diagnose`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Set results and navigate to results page
      setDiagnosisResult({
        disease: data.disease_diagnosis,
        species: data.species_identification,
        confidence_disease: data.disease_confidence,
        confidence_species: data.species_confidence,
        treatments: data.treatments || [],
        preventive_measures: data.preventive_measures || [],
        geo_solutions: data.geo_aware_solutions || [],
        timestamp: new Date().toISOString(),
      });

      setCurrentPage('results');
    } catch (err) {
      console.error('Diagnosis error:', err);
      setError(`Failed to diagnose: ${err.message}`);
      setLoading(false);
    }
  };

  /**
   * Handle new diagnosis - reset to diagnosis page
   */
  const handleNewDiagnosis = () => {
    setDiagnosisResult(null);
    setUploadedImage(null);
    setError(null);
    setCurrentPage('diagnosis');
  };

  /**
   * Handle navigation
   */
  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="plant-icon">🌿</span>
            Plant Health Diagnosis Tool
          </h1>
          <p className="app-subtitle">
            AI-powered disease detection and plant care guidance
          </p>
        </div>
      </header>

      {/* Navigation */}
      <nav className="app-nav">
        <button
          className={`nav-button ${currentPage === 'diagnosis' ? 'active' : ''}`}
          onClick={() => handleNavigate('diagnosis')}
        >
          📸 Diagnosis
        </button>
        {diagnosisResult && (
          <button
            className={`nav-button ${currentPage === 'results' ? 'active' : ''}`}
            onClick={() => handleNavigate('results')}
          >
            📊 Results
          </button>
        )}
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error}
            <button onClick={() => setError(null)} className="close-btn">×</button>
          </div>
        )}

        {currentPage === 'diagnosis' && (
          <DiagnosisPage
            onDiagnosis={handleDiagnosis}
            loading={loading}
            error={error}
          />
        )}

        {currentPage === 'results' && diagnosisResult && (
          <ResultsPage
            result={diagnosisResult}
            image={uploadedImage}
            onNewDiagnosis={handleNewDiagnosis}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>Plant Health Diagnosis Tool v1.0</p>
          <p>Powered by TensorFlow ResNet50 | Geo-Aware Solutions</p>
          <p className="footer-links">
            <a href="#about">About</a> |
            <a href="#help">Help</a> |
            <a href="#contact">Contact</a>
          </p>
        </div>
      </footer>

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Analyzing plant health...</p>
        </div>
      )}
    </div>
  );
}

export default App;
