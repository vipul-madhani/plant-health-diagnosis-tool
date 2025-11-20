import React from 'react';

function ConsultationHistory() {
  // TODO: Populate actual history via API
  return (
    <main className="history-container">
      <h1>Your Consultation History</h1>
      <ul className="history-list">
        <li>No consultations yet. Submit your first plant issue via the mobile app!</li>
        {/* Map over actual consultations here */}
      </ul>
    </main>
  );
}
export default ConsultationHistory;
