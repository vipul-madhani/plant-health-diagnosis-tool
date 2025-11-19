import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

/**
 * Admin Dashboard Component
 * Comprehensive admin panel for managing the platform
 */
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('registrations');
  const [adminData, setAdminData] = useState({
    registrations: [],
    consultations: [],
    agronomists: [],
    revenue: {},
    users: [],
    payouts: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);

  // Fetch admin data from backend
  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch pending registrations
        const regRes = await fetch('/admin/registrations/pending', { headers });
        const registrations = await regRes.json();

        // Fetch consultations
        const consRes = await fetch('/admin/consultations?status=active', { headers });
        const consultations = await consRes.json();

        // Fetch agronomists
        const agRes = await fetch('/admin/agronomists', { headers });
        const agronomists = await agRes.json();

        // Fetch revenue analytics
        const revRes = await fetch('/admin/revenue', { headers });
        const revenue = await revRes.json();

        setAdminData({
          registrations: registrations.data || [],
          consultations: consultations.data || [],
          agronomists: agronomists.data || [],
          revenue: revenue.data || {},
          users: [],
          payouts: []
        });
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [activeTab]);

  // Approve registration
  const handleApproveRegistration = async (registrationId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/admin/registrations/${registrationId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: 'Approved' })
      });
      if (response.ok) {
        alert('Registration approved successfully');
        setSelectedRegistration(null);
        // Refresh data
      }
    } catch (error) {
      alert('Error approving registration: ' + error.message);
    }
  };

  // Reject registration
  const handleRejectRegistration = async (registrationId, reason) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/admin/registrations/${registrationId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      if (response.ok) {
        alert('Registration rejected');
        setSelectedRegistration(null);
        // Refresh data
      }
    } catch (error) {
      alert('Error rejecting registration: ' + error.message);
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Plant Health Platform - Admin Dashboard</h1>
        <div className="admin-info">
          <span>Platform Manager</span>
          <button className="logout-btn">Logout</button>
        </div>
      </header>

      <nav className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'registrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('registrations')}
        >
          Registrations
        </button>
        <button
          className={`tab-btn ${activeTab === 'consultations' ? 'active' : ''}`}
          onClick={() => setActiveTab('consultations')}
        >
          Consultations
        </button>
        <button
          className={`tab-btn ${activeTab === 'agronomists' ? 'active' : ''}`}
          onClick={() => setActiveTab('agronomists')}
        >
          Agronomists
        </button>
        <button
          className={`tab-btn ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          Revenue
        </button>
        <button
          className={`tab-btn ${activeTab === 'payouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('payouts')}
        >
          Payouts
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </nav>

      <main className="admin-content">
        {loading && <div className="loading">Loading...</div>}

        {/* REGISTRATIONS TAB */}
        {activeTab === 'registrations' && (
          <div className="tab-content">
            <h2>Pending Agronomist Registrations</h2>
            <div className="registrations-queue">
              {adminData.registrations.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Document Type</th>
                      <th>AI Flags</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminData.registrations.map((reg) => (
                      <tr key={reg.id}>
                        <td>{reg.name}</td>
                        <td>{reg.document_type}</td>
                        <td>
                          <span className={`ai-flag ${reg.ai_flags ? 'warning' : 'ok'}`}>
                            {reg.ai_flags ? 'Review Needed' : 'Clear'}
                          </span>
                        </td>
                        <td>{new Date(reg.submitted_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn-approve"
                            onClick={() => handleApproveRegistration(reg.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn-reject"
                            onClick={() => handleRejectRegistration(reg.id, 'Document verification failed')}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-state">No pending registrations</p>
              )}
            </div>
          </div>
        )}

        {/* CONSULTATIONS TAB */}
        {activeTab === 'consultations' && (
          <div className="tab-content">
            <h2>Active Consultations (FIFO Queue)</h2>
            <div className="consultations-list">
              {adminData.consultations.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Agronomist</th>
                      <th>Status</th>
                      <th>Queue Position</th>
                      <th>Started</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminData.consultations.map((cons, idx) => (
                      <tr key={cons.id}>
                        <td>{cons.user_name}</td>
                        <td>{cons.agronomist_name}</td>
                        <td>
                          <span className={`status-badge ${cons.status}`}>
                            {cons.status.toUpperCase()}
                          </span>
                        </td>
                        <td>#{idx + 1}</td>
                        <td>{new Date(cons.started_at).toLocaleString()}</td>
                        <td>{cons.duration || 'Ongoing'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-state">No active consultations</p>
              )}
            </div>
          </div>
        )}

        {/* AGRONOMISTS TAB */}
        {activeTab === 'agronomists' && (
          <div className="tab-content">
            <h2>Verified Agronomists</h2>
            <div className="agronomists-list">
              {adminData.agronomists.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Consultations</th>
                      <th>Total Earnings</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminData.agronomists.map((agr) => (
                      <tr key={agr.id}>
                        <td>{agr.name}</td>
                        <td>{agr.phone}</td>
                        <td>{agr.email}</td>
                        <td>{agr.consultation_count || 0}</td>
                        <td>₹{agr.total_earnings || 0}</td>
                        <td>
                          <span className="status-badge verified">{agr.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-state">No verified agronomists</p>
              )}
            </div>
          </div>
        )}

        {/* REVENUE TAB */}
        {activeTab === 'revenue' && (
          <div className="tab-content">
            <h2>Revenue Analytics</h2>
            <div className="revenue-metrics">
              <div className="metric-card">
                <h3>Reports Revenue</h3>
                <p className="metric-value">₹{adminData.revenue.reports_revenue || 0}</p>
                <small>@₹99 per report</small>
              </div>
              <div className="metric-card">
                <h3>Consultations Revenue (30%)</h3>
                <p className="metric-value">₹{adminData.revenue.consultations_revenue || 0}</p>
                <small>From ₹299 consultations</small>
              </div>
              <div className="metric-card">
                <h3>API Revenue</h3>
                <p className="metric-value">₹{adminData.revenue.api_revenue || 0}</p>
                <small>B2B subscriptions</small>
              </div>
              <div className="metric-card highlight">
                <h3>Total Platform Revenue</h3>
                <p className="metric-value">₹{adminData.revenue.total_revenue || 0}</p>
                <small>All sources combined</small>
              </div>
            </div>
          </div>
        )}

        {/* PAYOUTS TAB */}
        {activeTab === 'payouts' && (
          <div className="tab-content">
            <h2>Collection-Based Payouts (Not Immediate)</h2>
            <button className="btn-process-payouts">Process Payouts</button>
            <div className="payouts-list">
              <h3>Pending Payouts</h3>
              <p className="empty-state">No pending payouts (collection-based system)</p>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="tab-content">
            <h2>User Directory</h2>
            <p className="empty-state">User management section</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
