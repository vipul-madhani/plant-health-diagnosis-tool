import React, { useState, useEffect } from 'react';
import '../styles/EnhancedUserDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const EnhancedUserDashboard = () => {
  const [userStats, setUserStats] = useState({ plantsAnalyzed: 0, consultations: 0, activePlans: 0, totalSpent: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [plantDatabase, setPlantDatabase] = useState([]);

  useEffect(() => { fetchUserData(); }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      // Secure endpoints
      const statsResp = await fetch(`${API_URL}/api/secure/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } });
      const statsJson = await statsResp.json();
      if (statsJson.success) setUserStats(statsJson.data);
      // Secure plants
      const plantsResp = await fetch(`${API_URL}/api/secure/plants/`, { headers: { Authorization: `Bearer ${token}` } });
      const plantsJson = await plantsResp.json();
      if (plantsJson.success) setPlantDatabase(plantsJson.data);
      // Secure activity
      const actResp = await fetch(`${API_URL}/api/secure/dashboard/activity`, { headers: { Authorization: `Bearer ${token}` } });
      const actJson = await actResp.json();
      if (actJson.success) setRecentActivity(actJson.data);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const getHealthColor = (health) => {
    const colors = {
      'excellent': '#28a745', 'good': '#52b788', 'fair': '#ffc107', 'needs attention': '#ff9800', 'critical': '#dc3545'
    };
    return colors[health] || '#6c757d';
  };

  return (
    <div className="enhanced-dashboard">
      <div className="dashboard-header"><h1>My Dashboard</h1><p>Welcome back! Here's an overview of your farming activities.</p></div>
      <div className="stats-overview">
        <div className="stat-card"><div className="stat-icon">🌱</div><div className="stat-info"><div className="stat-value">{userStats.plantsAnalyzed}</div><div className="stat-label">Plants Analyzed</div></div></div>
        <div className="stat-card"><div className="stat-icon">💬</div><div className="stat-info"><div className="stat-value">{userStats.consultations}</div><div className="stat-label">Consultations</div></div></div>
        <div className="stat-card"><div className="stat-icon">🌾</div><div className="stat-info"><div className="stat-value">{userStats.activePlans}</div><div className="stat-label">Active Crops</div></div></div>
        <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-info"><div className="stat-value">₹{userStats.totalSpent}</div><div className="stat-label">Total Spent</div></div></div>
      </div>
      <div className="quick-actions"><h2>Quick Actions</h2><div className="action-buttons"><button className="action-btn"><span className="btn-icon">📱</span><span>Open Mobile App</span></button><button className="action-btn"><span className="btn-icon">👨‍🌾</span><span>Start Consultation</span></button><button className="action-btn"><span className="btn-icon">➕</span><span>Add New Plant</span></button><button className="action-btn"><span className="btn-icon">📊</span><span>View Reports</span></button></div></div>
      <div className="plant-database-section"><div className="section-header"><h2>🌿 My Plant Database</h2><button className="btn-add">➕ Add Plant</button></div><div className="plants-grid">{plantDatabase.map(plant => (<div key={plant.id} className="plant-card"><div className="plant-image-placeholder"><span className="plant-emoji">🌱</span></div><div className="plant-info"><h3>{plant.plant_name}</h3><p className="plant-variety">{plant.variety}</p><p className="plant-date">Planted: {plant.planted_date}</p><div className="health-indicator" style={{ backgroundColor: getHealthColor(plant.health_status) }}>{plant.health_status}</div></div><div className="plant-actions"><button className="btn-view">View Details</button><button className="btn-update">Update Health</button></div></div>))}</div></div>
      <div className="recent-activity-section"><h2>🕒 Recent Activity</h2><div className="activity-list">{recentActivity.map(activity => (<div key={activity.id} className="activity-item"><div className="activity-icon">{activity.activity_type === 'diagnosis' && '🔬'}{activity.activity_type === 'consultation' && '💬'}{activity.activity_type === 'payment' && '💳'}{activity.activity_type === 'plant_added' && '🌱'}</div><div className="activity-content"><p><strong>{activity.activity_type.charAt(0).toUpperCase()+activity.activity_type.slice(1)}:</strong> {activity.description}</p><span className="activity-date">{activity.created_at}</span></div><div className="activity-status"><span className={`status-badge status-${activity.activity_type}`}>{activity.activity_type}</span></div></div>))}</div></div>
      <div className="app-cta-banner"><div className="app-cta-content"><span className="app-icon">📱</span><div><h3>Get the Mobile App for Full Features</h3><p>Chat with agronomists, get real-time notifications, and diagnose plants on-the-go</p></div><div className="app-download-btns"><button className="btn-download">App Store</button><button className="btn-download">Play Store</button></div></div></div>
    </div>
  );
};

export default EnhancedUserDashboard;
