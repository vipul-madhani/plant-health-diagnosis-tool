import React from 'react';
import { Link } from 'react-router-dom';

function UserDashboard() {
  // Mock stats and navigation tiles
  return (
    <main className="dashboard-container">
      <h1>Welcome to the Plant Community User Dashboard</h1>
      <section className="dashboard-tiles">
        <Link to="/history" className="dashboard-tile">Consultation History</Link>
        <Link to="/profile" className="dashboard-tile">Profile & Settings</Link>
        <Link to="/blogs" className="dashboard-tile">Community Blogs</Link>
        <Link to="/payments" className="dashboard-tile">Payment/Invoices</Link>
        <Link to="/help" className="dashboard-tile">Help & Support</Link>
      </section>
      <section style={{ marginTop: 40 }}>
        <h2>Your Activity Summary</h2>
        <div className="dashboard-summary">
          <div>Consultations: 0</div>
          <div>Blogs Contributed: 0</div>
          <div>Last Diagnosis: --</div>
        </div>
      </section>
    </main>
  );
}

export default UserDashboard;
