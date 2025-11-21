import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminAgronomistQueue = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/agronomist/pending`);
      const data = await res.json();
      if (data.success && data.data) setPending(data.data);
    } catch (err) {
      alert('Failed to fetch pending agronomists');
    }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this agronomist registration?')) return;
    await fetch(`${API_URL}/api/agronomist/approve/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: 'Welcome onboard!' }) });
    fetchPending();
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection:','Incomplete or invalid documents');
    if (!reason) return;
    await fetch(`${API_URL}/api/agronomist/reject/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) });
    fetchPending();
  };

  return (
    <div className="admin-agro-queue">
      <h2>Pending Agronomist Registrations</h2>
      {loading && <div>Loading...</div>}
      {!loading && pending.length === 0 && <div>No pending registrations.</div>}
      {!loading && pending.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Type</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map(row => (
              <tr key={row.id}>
                <td>{row.full_name}</td>
                <td>{row.email}</td>
                <td>{row.phone}</td>
                <td>{row.registration_type}</td>
                <td>{new Date(row.created_at).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleApprove(row.id)} style={{ background: '#2d6a4f', color: 'white', marginRight: 6 }}>Approve</button>
                  <button onClick={() => handleReject(row.id)} style={{ background: '#e74c3c', color: 'white' }}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminAgronomistQueue;
