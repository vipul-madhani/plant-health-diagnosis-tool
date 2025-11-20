import React from 'react';
import { useNavigate } from 'react-router-dom';

function UserRegister() {
  const navigate = useNavigate();
  const handleRegister = (e) => {
    e.preventDefault();
    // Mock registration
    navigate('/dashboard');
  };
  return (
    <main className="register-container">
      <h1>Create Your Plant Community Account</h1>
      <form onSubmit={handleRegister} className="register-form">
        <input type="text" placeholder="Full Name" required />
        <input type="email" placeholder="Email" required />
        <input type="tel" placeholder="Phone" required />
        <input type="password" placeholder="Password" required />
        <button type="submit">Register</button>
      </form>
      <div>Already have an account? <a href="/login">Login</a></div>
    </main>
  );
}
export default UserRegister;
