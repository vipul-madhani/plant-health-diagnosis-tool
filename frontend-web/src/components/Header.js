import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide header on login/register pages
  const hideOnPages = ['/login', '/user-login', '/register', '/user-register', '/agronomist-registration'];
  const shouldShowHeader = !hideOnPages.includes(location.pathname);

  if (!shouldShowHeader) return null;

  return (
    <header className="main-header">
      <div className="header-container">
        {/* Logo Section */}
        <div className="logo-section" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="AgriIQ Logo" className="logo-img" />
          <span className="logo-text">AgriIQ</span>
        </div>

        {/* Navigation Actions */}
        <nav className="header-nav">
          <button 
            className="btn-agronomist"
            onClick={() => navigate('/agronomist-registration')}
          >
            🌾 For Agronomists
          </button>
          
          <button 
            className="btn-login"
            onClick={() => navigate('/user-login')}
          >
            Login
          </button>
          
          <button 
            className="btn-register"
            onClick={() => navigate('/user-register')}
          >
            Register
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
