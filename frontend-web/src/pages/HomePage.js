import React from 'react';
import '../styles/HomePage.css';
import PricingPlans from '../components/PricingPlans';
import StatsCounter from '../components/StatsCounter';

const HomePage = ({ onNavigate }) => {
  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Your Crops Deserve Expert Care
          </h1>
          <p className="hero-subtitle">
            Connect with certified agronomists instantly. Get AI-powered plant health diagnosis
            and personalized treatment plans through our mobile app.
          </p>
          <div className="hero-buttons">
            <button className="cta-primary" onClick={() => onNavigate && onNavigate('diagnosis')}>
              🔬 Try Free Diagnosis
            </button>
            <button className="cta-secondary" onClick={() => window.scrollTo({ top: document.getElementById('pricing').offsetTop, behavior: 'smooth' })}>
              💰 View Pricing
            </button>
          </div>
          <div className="app-badges">
            <img src="/app-store-badge.png" alt="Download on App Store" className="app-badge" />
            <img src="/play-store-badge.png" alt="Get it on Google Play" className="app-badge" />
          </div>
        </div>
        <div className="hero-image">
          <img src="/hero-farmer.png" alt="Farmer using AgriIQ app" />
        </div>
      </section>

      {/* Stats Counter */}
      <StatsCounter />

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="section-title">How AgriIQ Works</h2>
        <p className="section-subtitle">Get expert plant care advice in 3 simple steps</p>
        
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon">📸</div>
            <h3>Capture & Upload</h3>
            <p>Take a photo of your affected plant using our mobile app</p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon">🤖</div>
            <h3>AI Diagnosis</h3>
            <p>Get instant AI-powered disease identification and preliminary analysis</p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon">👨‍🌾</div>
            <h3>Expert Consultation</h3>
            <p>Chat with certified agronomists for personalized treatment plans</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Choose AgriIQ?</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🌱</span>
            <h3>AI-Powered Diagnosis</h3>
            <p>Advanced machine learning trained on real crop data for accurate disease identification</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">💬</span>
            <h3>Live Agronomist Chat</h3>
            <p>Connect with expert agronomists in real-time through our mobile app</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">🌿</span>
            <h3>Organic Solutions</h3>
            <p>Get geo-aware organic treatment recommendations based on your location</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">📈</span>
            <h3>Crop Tracking</h3>
            <p>Maintain digital records of all your plants and track health over time</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">☁️</span>
            <h3>Weather Insights</h3>
            <p>Receive weather-based crop care recommendations and alerts</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h3>Analytics Dashboard</h3>
            <p>View detailed analysis and history of all your consultations</p>
          </div>
        </div>
      </section>

      {/* Platform Info - Uber/Ola Style */}
      <section className="platform-info">
        <div className="platform-content">
          <div className="platform-text">
            <h2>Platform for Everyone</h2>
            <p>
              AgriIQ connects farmers with expert agronomists, creating a marketplace
              for agricultural knowledge and expertise.
            </p>
            
            <div className="user-types">
              <div className="user-type">
                <h4>👨‍🌾 For Farmers</h4>
                <ul>
                  <li>Access expert advice anytime</li>
                  <li>Pay only for consultations you need</li>
                  <li>Build your plant health database</li>
                  <li>Get community support</li>
                </ul>
              </div>

              <div className="user-type">
                <h4>🌾 For Agronomists</h4>
                <ul>
                  <li>Earn 70% of consultation fees</li>
                  <li>Flexible working hours</li>
                  <li>Build your client base</li>
                  <li>Admin approval required</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="platform-stats">
            <div className="stat-box">
              <div className="stat-value">95%</div>
              <div className="stat-label">Farmer Satisfaction</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">500+</div>
              <div className="stat-label">Verified Agronomists</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">24/7</div>
              <div className="stat-label">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing">
        <PricingPlans />
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your Farming?</h2>
          <p>Join thousands of farmers already using AgriIQ</p>
          <div className="cta-buttons">
            <button className="btn-register" onClick={() => onNavigate && onNavigate('register')}>
              Sign Up Now
            </button>
            <button className="btn-login" onClick={() => onNavigate && onNavigate('login')}>
              Login
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
