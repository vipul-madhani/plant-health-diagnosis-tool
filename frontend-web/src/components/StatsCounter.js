import React, { useState, useEffect } from 'react';
import '../styles/StatsCounter.css';

const StatsCounter = () => {
  const [stats, setStats] = useState({
    plantsAnalyzed: 0,
    accuracy: 95,
    agronomists: 500
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/stats/plants-analyzed`);
      const data = await response.json();
      animateValue(0, data.count || 15234, 2000);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Fallback to mock data with animation
      animateValue(0, 15234, 2000);
    }
  };

  const animateValue = (start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentValue = Math.floor(progress * (end - start) + start);
      
      setStats(prev => ({
        ...prev,
        plantsAnalyzed: currentValue
      }));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  return (
    <section className="stats-section">
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-number">{stats.plantsAnalyzed.toLocaleString()}+</div>
          <div className="stat-label">Plants Analyzed</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-number">{stats.accuracy}%</div>
          <div className="stat-label">Accuracy Rate</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🌾</div>
          <div className="stat-number">Real Data</div>
          <div className="stat-label">ML Trained Model</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👨‍🌾</div>
          <div className="stat-number">{stats.agronomists}+</div>
          <div className="stat-label">Expert Agronomists</div>
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;
