import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ConsultationDetailPage.css';

const ConsultationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [consultation, setConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsultationDetails();
    fetchMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchConsultationDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/consultation/${id}`);
      setConsultation(response.data);
    } catch (error) {
      console.error('Error fetching consultation:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/chat/${id}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await api.post(`/chat/${id}`, { message: newMessage });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const handleCompleteConsultation = async () => {
    try {
      await api.put(`/consultation/${id}/complete`);
      alert('Consultation marked as complete!');
      fetchConsultationDetails();
    } catch (error) {
      console.error('Error completing consultation:', error);
      alert('Failed to complete consultation');
    }
  };

  const handleMarkAsCollected = async () => {
    try {
      await api.put(`/consultation/${id}/collect-payment`);
      alert('Payment marked as collected!');
      fetchConsultationDetails();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    }
  };

  if (loading) {
    return <div className="loading">Loading consultation details...</div>;
  }

  if (!consultation) {
    return <div className="error">Consultation not found</div>;
  }

  return (
    <div className="consultation-detail-page">
      <button onClick={() => navigate(-1)} className="back-btn">
        ← Back
      </button>

      <div className="consultation-header">
        <h1>Consultation Details</h1>
        <span className={`status-badge ${consultation.status}`}>
          {consultation.status}
        </span>
      </div>

      <div className="consultation-info">
        <div className="info-section">
          <h2>Consultation Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">ID:</span>
              <span className="value">#{consultation._id.slice(-8)}</span>
            </div>
            <div className="info-item">
              <span className="label">Amount:</span>
              <span className="value">
                ₹{consultation.amount?.toLocaleString('en-IN') || 0}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Date:</span>
              <span className="value">
                {new Date(consultation.createdAt).toLocaleDateString('en-IN')}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Payment Status:</span>
              <span className={`payment-badge ${consultation.paymentStatus}`}>
                {consultation.paymentStatus === 'collected' ? 'Collected' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {user?.role === 'farmer' && consultation.agronomist && (
          <div className="info-section">
            <h2>Agronomist Details</h2>
            <p><strong>Name:</strong> {consultation.agronomist.name}</p>
            <p><strong>Email:</strong> {consultation.agronomist.email}</p>
            <p><strong>Phone:</strong> {consultation.agronomist.phone}</p>
          </div>
        )}

        {user?.role === 'agronomist' && consultation.farmer && (
          <div className="info-section">
            <h2>Farmer Details</h2>
            <p><strong>Name:</strong> {consultation.farmer.name}</p>
            <p><strong>Email:</strong> {consultation.farmer.email}</p>
            <p><strong>Phone:</strong> {consultation.farmer.phone}</p>
            <p><strong>Region:</strong> {consultation.farmer.region}</p>
          </div>
        )}

        <div className="info-section">
          <h2>Plant Images</h2>
          <div className="image-gallery">
            {consultation.images?.map((img, index) => (
              <img key={index} src={img} alt={`Plant ${index + 1}`} />
            ))}
          </div>
        </div>

        {consultation.diagnosis && (
          <div className="info-section">
            <h2>Diagnosis</h2>
            <p>{consultation.diagnosis}</p>
          </div>
        )}
      </div>

      <div className="chat-section">
        <h2>Messages</h2>
        <div className="messages-container">
          {messages.length === 0 ? (
            <p className="no-messages">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`message ${msg.sender._id === user?._id ? 'sent' : 'received'}`}
              >
                <div className="message-header">
                  <span className="sender-name">{msg.sender.name}</span>
                  <span className="message-time">
                    {new Date(msg.createdAt).toLocaleTimeString('en-IN')}
                  </span>
                </div>
                <div className="message-content">{msg.message}</div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSendMessage} className="message-form">
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </div>

      <div className="actions-section">
        {user?.role === 'agronomist' && consultation.status === 'in-progress' && (
          <button onClick={handleCompleteConsultation} className="complete-btn">
            Mark as Complete
          </button>
        )}

        {user?.role === 'farmer' && 
         consultation.status === 'completed' && 
         consultation.paymentStatus === 'pending' && (
          <button onClick={handleMarkAsCollected} className="collect-btn">
            Mark Payment as Collected
          </button>
        )}
      </div>

      <div className="payout-info">
        <p className="note">
          * Platform commission: 30% | Agronomist earnings: 70%
        </p>
        {user?.role === 'agronomist' && (
          <p className="earnings">
            Your earnings from this consultation: ₹{(consultation.amount * 0.7).toLocaleString('en-IN')}
          </p>
        )}
      </div>
    </div>
  );
};

export default ConsultationDetailPage;
