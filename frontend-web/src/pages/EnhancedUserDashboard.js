import React, { useState, useEffect } from 'react';
import '../styles/EnhancedUserDashboard.css';

const EnhancedUserDashboard = () => {
  const [userStats, setUserStats] = useState({
    plantsAnalyzed: 0,
    consultations: 0,
    activePlans: 0,
    totalSpent: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [plantDatabase, setPlantDatabase] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Fetch user statistics
      // const statsResponse = await fetch(`${API_URL}/api/user/stats`, {
      //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      // });
      // const stats = await statsResponse.json();
      
      // Mock data for now
      setUserStats({
        plantsAnalyzed: 24,
        consultations: 12,
        activePlans: 3,
        totalSpent: 2497
      });

      setRecentActivity([
        { id: 1, type: 'diagnosis', plant: 'Tomato Plant', date: '2025-11-20', status: 'completed' },
        { id: 2, type: 'consultation', agronomist: 'Dr. Sharma', date: '2025-11-19', status: 'completed' },
        { id: 3, type: 'payment', amount: 299, date: '2025-11-19', status: 'paid' },
      ]);

      setPlantDatabase([
        { id: 1, name: 'Tomato Plant #1', variety: 'Roma', planted: '2025-10-15', health: 'good', image: '/plant1.jpg' },
        { id: 2, name: 'Wheat Field A', variety: 'HD-2967', planted: '2025-11-01', health: 'excellent', image: '/plant2.jpg' },
        { id: 3, name: 'Cotton Crop B', variety: 'BT-Cotton', planted: '2025-10-20', health: 'needs attention', image: '/plant3.jpg' },
      ]);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const getHealthColor = (health) => {
    const colors = {
      'excellent': '#28a745',
      'good': '#52b788',
      'fair': '#ffc107',
      'needs attention': '#ff9800',
      'critical': '#dc3545'
    };
    return colors[health] || '#6c757d';
  };

  return (
    <div className="enhanced-dashboard">
      <div className="dashboard-header">
        <h1>My Dashboard</h1>
        <p>Welcome back! Here's an overview of your farming activities.</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">🌱</div>
          <div className="stat-info">
            <div className="stat-value">{userStats.plantsAnalyzed}</div>
            <div className="stat-label">Plants Analyzed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-info">
            <div className="stat-value">{userStats.consultations}</div>
            <div className="stat-label">Consultations</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🌾</div>
          <div className="stat-info">
            <div className="stat-value">{userStats.activePlans}</div>
            <div className="stat-label">Active Crops</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <div className="stat-value">₹{userStats.totalSpent}</div>
            <div className="stat-label">Total Spent</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn">
            <span className="btn-icon">📱</span>
            <span>Open Mobile App</span>
          </button>
          <button className="action-btn">
            <span className="btn-icon">👨‍🌾</span>
            <span>Start Consultation</span>
          </button>
          <button className="action-btn">
            <span className="btn-icon">➕</span>
            <span>Add New Plant</span>
          </button>
          <button className="action-btn">
            <span className="btn-icon">📊</span>
            <span>View Reports</span>
          </button>
        </div>
      </div>

      {/* Plant Database */}
      <div className="plant-database-section">
        <div className="section-header">
          <h2>🌿 My Plant Database</h2>
          <button className="btn-add">➕ Add Plant</button>
        </div>
        
        <div className="plants-grid">
          {plantDatabase.map(plant => (
            <div key={plant.id} className="plant-card">
              <div className="plant-image-placeholder">
                <span className="plant-emoji">🌱</span>
              </div>
              <div className="plant-info">
                <h3>{plant.name}</h3>
                <p className="plant-variety">{plant.variety}</p>
                <p className="plant-date">Planted: {plant.planted}</p>
                <div 
                  className="health-indicator"
                  style={{ backgroundColor: getHealthColor(plant.health) }}
                >
                  {plant.health}
                </div>
              </div>
              <div className="plant-actions">
                <button className="btn-view">View Details</button>
                <button className="btn-update">Update Health</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity-section">
        <h2>🕒 Recent Activity</h2>
        <div className="activity-list">
          {recentActivity.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                {activity.type === 'diagnosis' && '🔬'}
                {activity.type === 'consultation' && '💬'}
                {activity.type === 'payment' && '💳'}
              </div>
              <div className="activity-content">
                {activity.type === 'diagnosis' && (
                  <p><strong>Plant Diagnosis:</strong> {activity.plant}</p>
                )}
                {activity.type === 'consultation' && (
                  <p><strong>Consultation with:</strong> {activity.agronomist}</p>
                )}
                {activity.type === 'payment' && (
                  <p><strong>Payment:</strong> ₹{activity.amount} paid</p>
                )}
                <span className="activity-date">{activity.date}</span>
              </div>
              <div className="activity-status">
                <span className={`status-badge status-${activity.status}`}>
                  {activity.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* App Download CTA */}
      <div className="app-cta-banner">
        <div className="app-cta-content">
          <span className="app-icon">📱</span>
          <div>
            <h3>Get the Mobile App for Full Features</h3>
            <p>Chat with agronomists, get real-time notifications, and diagnose plants on-the-go</p>
          </div>
          <div className="app-download-btns">
            <button className="btn-download">App Store</button>
            <button className="btn-download">Play Store</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedUserDashboard;
