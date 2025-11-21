import React, { useState } from 'react';
import './styles/index.css';
import Header from './components/Header';
import StatsCounter from './components/StatsCounter';
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
 * - Analytics dashboard with stats counter
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
  const handleDiagnosisComplete = (response) => {
    // response is whatever diagnosePlant() returns: { class_index, confidence, ... }
    setDiagnosisResult({
      // adapt to your backend response
      disease: response.disease_diagnosis || null,
      species: response.species_identification || null,
      confidence_disease: response.disease_confidence || null,
      confidence_species: response.species_confidence || null,
      treatments: response.treatments || [],
      preventive_measures: response.preventive_measures || [],
      geo_solutions: response.geo_aware_solutions || [],
      timestamp: new Date().toISOString(),
    });
    setCurrentPage('results');
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
      {/* New Header Component with Logo and Nav */}
      <Header currentPage={currentPage} onNavigate={handleNavigate} />

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
          onDiagnosisComplete={handleDiagnosisComplete} // <--- rename prop here!
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
      <footer style={{ textAlign: 'center', padding: 20, background: '#dfefdf', color: '#234567', fontWeight: 500 }}>
        Plant Health Diagnosis Tool ©2025 | Powered by AgriIQ
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
