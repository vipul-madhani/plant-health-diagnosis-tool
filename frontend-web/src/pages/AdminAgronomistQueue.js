import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminAgronomistQueue = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  React.useEffect(() => {
    fetchRegistrations();
  }, [filter]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/agronomist/pending?status=${filter}`);
      const data = await res.json();
      if (data.success && data.data) setPending(data.data);
    } catch (err) {
      alert('Failed to fetch agronomist registrations');
    }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this agronomist registration?')) return;
    await fetch(`${API_URL}/api/agronomist/approve/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: 'Welcome onboard!' }) });
    fetchRegistrations();
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection:', 'Incomplete or invalid documents');
    if (!reason) return;
    await fetch(`${API_URL}/api/agronomist/reject/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) });
    fetchRegistrations();
  };

  const columns = [
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'registration_type', label: 'Type' },
    { key: 'specializations', label: 'Specializations' },
    { key: 'qualification', label: 'Qualification' },
    { key: 'years_experience', label: 'Experience' },
    { key: 'created_at', label: 'Submitted' }
  ];

  return (
    <div className="admin-agro-queue">
      <h2>Agronomist Registrations</h2>
      <label>
        Status Filter:{' '}
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>
      {loading && <div>Loading...</div>}
      {!loading && pending.length === 0 && <div>No registrations for selected filter.</div>}
      {!loading && pending.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map(row => (
              <tr key={row.id}>
                {columns.map(col => (
                  <td key={col.key}>{typeof row[col.key] === 'string' ? row[col.key] : JSON.stringify(row[col.key])}</td>
                ))}
                <td>
                  {filter === 'pending' && <>
                    <button onClick={() => handleApprove(row.id)} style={{ background: '#2d6a4f', color: 'white', marginRight: 6 }}>Approve</button>
                    <button onClick={() => handleReject(row.id)} style={{ background: '#e74c3c', color: 'white' }}>Reject</button>
                  </>}
                  {filter === 'approved' && <span style={{ color: '#2d6a4f' }}>✔️ Approved</span>}
                  {filter === 'rejected' && <span style={{ color: '#e74c3c' }}>❌ Rejected</span>}
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
