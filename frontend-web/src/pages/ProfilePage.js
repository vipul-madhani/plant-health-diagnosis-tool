import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    region: '',
  });
  const [consultations, setConsultations] = useState([]);
  const [payoutSummary, setPayoutSummary] = useState({
    totalEarned: 0,
    collectedAmount: 0,
    pendingAmount: 0,
    consultationCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const regions = ['North', 'South', 'East', 'West', 'Central', 'Northeast'];

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        region: user.region || '',
      });
      fetchConsultationHistory();
      if (user.role === 'agronomist') {
        fetchPayoutSummary();
      }
    }
  }, [user]);

  const fetchConsultationHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/consultation/history');
      setConsultations(response.data);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayoutSummary = async () => {
    try {
      const response = await api.get('/consultation/payout-summary');
      setPayoutSummary(response.data);
    } catch (error) {
      console.error('Error fetching payout summary:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const response = await api.put('/auth/profile', formData);
      updateUser(response.data);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>My Profile</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="card-header">
            <h2>Personal Information</h2>
            <button
              onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
              className="edit-btn"
            >
              {isEditing ? 'Save' : 'Edit'}
            </button>
          </div>

          <div className="profile-form">
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label>Phone:</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label>Region:</label>
              <select
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                disabled={!isEditing}
              >
                <option value="">Select Region</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Role:</label>
              <input
                type="text"
                value={user?.role || 'N/A'}
                disabled
              />
            </div>
          </div>
        </div>

        {user?.role === 'agronomist' && (
          <div className="payout-card">
            <h2>Payout Summary</h2>
            <div className="payout-grid">
              <div className="payout-item">
                <span className="payout-label">Total Earned (70%):</span>
                <span className="payout-value">
                  ₹{payoutSummary.totalEarned.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="payout-item">
                <span className="payout-label">Collected Amount:</span>
                <span className="payout-value collected">
                  ₹{payoutSummary.collectedAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="payout-item">
                <span className="payout-label">Pending Collection:</span>
                <span className="payout-value pending">
                  ₹{payoutSummary.pendingAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="payout-item">
                <span className="payout-label">Consultations Completed:</span>
                <span className="payout-value">
                  {payoutSummary.consultationCount}
                </span>
              </div>
            </div>
            <p className="payout-note">
              * Payouts are collection-based. Amount shows as Collected once farmer pays.
            </p>
          </div>
        )}

        <div className="consultation-history">
          <h2>Consultation History</h2>
          {loading ? (
            <p>Loading consultations...</p>
          ) : consultations.length === 0 ? (
            <p>No consultations yet.</p>
          ) : (
            <div className="consultations-list">
              {consultations.map(consultation => (
                <div key={consultation._id} className="consultation-item">
                  <div className="consultation-header">
                    <span className="consultation-id">#{consultation._id.slice(-6)}</span>
                    <span className={`status-badge ${consultation.status}`}>
                      {consultation.status}
                    </span>
                  </div>
                  <p className="consultation-date">
                    {new Date(consultation.createdAt).toLocaleDateString('en-IN')}
                  </p>
                  {user?.role === 'farmer' && consultation.agronomist && (
                    <p className="consultation-agronomist">
                      Agronomist: {consultation.agronomist.name}
                    </p>
                  )}
                  {user?.role === 'agronomist' && consultation.farmer && (
                    <p className="consultation-farmer">
                      Farmer: {consultation.farmer.name}
                    </p>
                  )}
                  <div className="consultation-payment">
                    <span>Amount: ₹{consultation.amount?.toLocaleString('en-IN') || 0}</span>
                    <span className={`payment-status ${consultation.paymentStatus}`}>
                      {consultation.paymentStatus === 'collected' ? 'Collected' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
