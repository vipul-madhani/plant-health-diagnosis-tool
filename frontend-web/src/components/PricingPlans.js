import React from 'react';
import '../styles/PricingPlans.css';

const PricingPlans = () => {
  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      price: '₹0',
      period: 'forever',
      features: [
        'AI-powered plant diagnosis (web only)',
        'Access to community blog & articles',
        'View public plant health tips',
        'Basic disease identification',
        'Save up to 5 plant records'
      ],
      limitations: [
        'No chat with agronomists',
        'No personalized advice',
        'Limited diagnosis history'
      ],
      cta: 'Start Free',
      popular: false,
      color: '#74c69d'
    },
    {
      id: 'pay-per-chat',
      name: 'Pay Per Consultation',
      price: '₹299',
      period: 'per chat session',
      features: [
        'Everything in Free plan',
        'Live chat with expert agronomist',
        'Personalized treatment plans',
        'Upload unlimited plant images',
        'Detailed diagnosis reports',
        'Save unlimited plant records',
        '24-hour chat session access',
        'Download consultation history'
      ],
      cta: 'Chat Now',
      popular: true,
      color: '#2d6a4f',
      badge: 'Most Popular'
    },
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '₹999',
      period: 'per month',
      features: [
        'Everything in Pay Per Chat',
        'Unlimited agronomist consultations',
        'Priority expert matching',
        'Weekly plant health updates',
        'Crop management calendar',
        'Weather-based recommendations',
        'Organic solution database',
        'Email & chat support'
      ],
      savings: 'Save ₹597/month',
      cta: 'Subscribe Monthly',
      popular: false,
      color: '#52b788'
    },
    {
      id: 'annual',
      name: 'Annual Plan',
      price: '₹8,999',
      period: 'per year',
      features: [
        'Everything in Monthly plan',
        'Dedicated agronomist support',
        'On-site farm visit (once/year)*',
        'Soil health analysis',
        'Custom crop planning',
        'Priority 24/7 support',
        'Advanced analytics dashboard',
        'Free access to premium workshops'
      ],
      savings: 'Save ₹3,000/year',
      cta: 'Subscribe Annually',
      popular: false,
      color: '#1b4332',
      badge: 'Best Value'
    }
  ];

  return (
    <section className="pricing-section">
      <div className="pricing-header">
        <h2>Choose Your Plan</h2>
        <p className="pricing-subtitle">
          Get expert agronomist advice through our mobile app. Start free or upgrade for unlimited consultations.
        </p>
        <div className="app-download-banner">
          <span className="mobile-icon">📱</span>
          <p><strong>Note:</strong> Chat consultations are only available through our mobile app. Download now!</p>
        </div>
      </div>

      <div className="pricing-grid">
        {plans.map(plan => (
          <div 
            key={plan.id} 
            className={`pricing-card ${plan.popular ? 'popular' : ''}`}
            style={{ borderTopColor: plan.color }}
          >
            {plan.badge && (
              <div className="plan-badge" style={{ backgroundColor: plan.color }}>
                {plan.badge}
              </div>
            )}
            
            <div className="plan-header">
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price">
                <span className="price">{plan.price}</span>
                <span className="period">/{plan.period}</span>
              </div>
              {plan.savings && (
                <div className="savings-badge">{plan.savings}</div>
              )}
            </div>

            <ul className="features-list">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="feature-item">
                  <span className="check-icon">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            {plan.limitations && (
              <ul className="limitations-list">
                {plan.limitations.map((limitation, idx) => (
                  <li key={idx} className="limitation-item">
                    <span className="cross-icon">✗</span>
                    {limitation}
                  </li>
                ))}
              </ul>
            )}

            <button 
              className={`cta-button ${plan.popular ? 'popular-cta' : ''}`}
              style={{ backgroundColor: plan.color }}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="pricing-footer">
        <p className="footer-note">
          * On-site farm visit available for farms within 50km radius. Additional charges may apply for remote locations.
        </p>
        <p className="platform-commission">
          Platform fee: 30% • Agronomist earnings: 70% of consultation fee
        </p>
      </div>
    </section>
  );
};

export default PricingPlans;
