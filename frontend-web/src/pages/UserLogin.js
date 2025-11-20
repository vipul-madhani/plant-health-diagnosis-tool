import React from 'react';
import { useNavigate } from 'react-router-dom';

function UserLogin() {
  const navigate = useNavigate();
  // TODO: Implement actual authentication logic later
  const handleLogin = (e) => {
    e.preventDefault();
    // Mock login - route to dashboard
    navigate('/dashboard');
  };
  return (
    <main className="login-container">
      <h1>Login to Your Plant Journey Account</h1>
      <form onSubmit={handleLogin} className="login-form">
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
      <div>Don't have an account? <a href="/register">Register</a></div>
    </main>
  );
}
export default UserLogin;
