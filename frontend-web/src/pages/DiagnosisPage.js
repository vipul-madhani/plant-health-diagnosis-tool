import React, { useState } from 'react';
import ImageUpload from '../components/ImageUpload';
import { diagnosePlant } from '../services/api';

const DiagnosisPage = ({ onDiagnosisComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleImageSelect = (file, preview) => {
    setSelectedFile(file);
    setImagePreview(preview);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // pass the selected File directly, no FormData
      const response = await diagnosePlant(selectedFile);
      onDiagnosisComplete(response);
    } catch (err) {
      setError(err.message || 'Failed to analyze plant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="diagnosis-page">
      <div className="diagnosis-container">
        <h1>Plant Health Diagnosis</h1>
        <p className="subtitle">Upload an image of your plant to get started with health analysis</p>

        <form onSubmit={handleSubmit} className="diagnosis-form">
          <ImageUpload onImageSelect={handleImageSelect} />

          {imagePreview && (
            <div className="image-preview-section">
              <h3>Selected Image:</h3>
              <img src={imagePreview} alt="Selected plant" className="preview-image" />
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedFile || loading}
            className="analyze-button"
          >
            {loading ? 'Analyzing Plant...' : 'Analyze Plant Health'}
          </button>
        </form>

        <div className="info-section">
          <h3>How it works:</h3>
          <ul>
            <li>Upload a clear photo of your plant</li>
            <li>AI identifies the plant species</li>
            <li>Detects diseases and health issues</li>
            <li>Provides treatment recommendations</li>
            <li>Shows geo-aware organic solutions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisPage;
