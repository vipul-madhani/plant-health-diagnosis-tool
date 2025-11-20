import React, { useState } from 'react';
import ImageUpload from '../components/ImageUpload';
import { diagnosePlant } from '../services/api';

const DiagnosisPage = ({ onDiagnosisComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);


  const handleImageSelect = (file, preview) => {
    console.log("File received from ImageUpload:", file);
    setSelectedFile(file);
    setImagePreview(preview);
    setError('');
  };
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    setResult(null);
  
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult(data);  // <-- store for display
    } catch (err) {
      setError('Failed to analyze plant. Please try again.');
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
        {result && (
          <div className="result-section">
            <h3>Diagnosis Result:</h3>
            <p><strong>Class Index:</strong> {result.class_index}</p>
            <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(2)}%</p>
          </div>
        )}

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
