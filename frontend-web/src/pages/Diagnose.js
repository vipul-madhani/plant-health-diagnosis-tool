import React, { useState } from 'react';
import axios from 'axios';

function Diagnose() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
    setResult('');
    setError('');
  };

  const handleDiagnose = async () => {
    if (!image) {
      setError('Please select an image!');
      return;
    }
    setLoading(true);
    setResult('');
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', image);
      const response = await axios.post(
        'http://localhost:8000/predict/',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setResult(`Prediction: Class ${response.data.class_index}, Confidence: ${(response.data.confidence * 100).toFixed(2)}%`);
    } catch (err) {
      setError('Prediction failed. Please try another image or check ML server.');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 40, maxWidth: 400, margin: '0 auto', background: '#f9f9f9', borderRadius: 10 }}>
      <h2>Plant Health Diagnosis</h2>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      <br /><br />
      <button style={{ padding: 10, fontSize: 16 }} onClick={handleDiagnose} disabled={loading}>
        {loading ? 'Diagnosing...' : 'Diagnose'}
      </button>
      {error && (
        <div style={{ color: 'red', marginTop: 16 }}>{error}</div>
      )}
      {result && (
        <div style={{ color: 'green', marginTop: 16 }}>{result}</div>
      )}
    </div>
  );
}

export default Diagnose;
