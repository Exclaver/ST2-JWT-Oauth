import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([
    {
      id: 1,
      name: "Free",
      price: 0,
      features: ["5 Credits/Month", "Basic Text Extraction", "Email Support"],
      popular: false
    },
    {
      id: 2,
      name: "Pro",
      price: 9.99,
      features: ["100 Credits/Month", "Advanced OCR", "Priority Support", "Export to PDF"],
      popular: true
    },
    {
      id: 3,
      name: "Enterprise",
      price: 29.99,
      features: ["Unlimited Credits", "Team Sharing", "API Access", "24/7 Support"],
      popular: false
    }
  ]);

  return (
    <div className="home-container">
      <div className="gradient-bg"></div>
      
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Extract Any Text with <span className="gradient-text">One Click</span></h1>
          <p className="subtitle">The ultimate Chrome extension for seamlessly extracting text from any website, image, or PDF</p>
          
          <a 
            href="https://chrome.google.com/webstore/detail/selecttextexe/lamomcdfocoklbenmamelleakhmpodge" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="add-chrome-btn"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google"></img>
            Add to Chrome - It's Free
          </a>
          
          <div className="stats">
            <div className="stat">
              <span className="stat-number">100K+</span>
              <span className="stat-label">Users</span>
            </div>
            <div className="stat">
              <span className="stat-number">4.8</span>
              <span className="stat-label">Rating</span>
            </div>
            <div className="stat">
              <span className="stat-number">15M+</span>
              <span className="stat-label">Extractions</span>
            </div>
          </div>
        </div>
        
        <div className="hero-image">
          <img src="/images/extension-demo.png" alt="SelectText Extension Demo" />
          <div className="glow"></div>
        </div>
      </section>
      
      {/* Tutorial Section */}
      <section className="tutorial-section">
        <div className="section-header">
          <h2>How It <span className="gradient-text">Works</span></h2>
          <p>Watch our quick tutorial to see the extension in action</p>
        </div>
        
        <div className="video-container">
        <iframe 
  src="https://www.youtube.com/embed/mLWD4g7n5Ic?autoplay=0&rel=0" 
  title="SelectText Tutorial" 
  frameBorder="0" 
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
  allowFullScreen
></iframe>
        </div>
        <div className="section-header">
          <h2> <span className="gradient-text">Plan</span></h2>
          <p>Select the package that fits your needs</p>
        </div>
        <div className="tutorial-steps">
          <div className="step">
            <div className="step-icon">1</div>
            <h3>Install the Extension</h3>
            <p>Add SelectText to Chrome with one click</p>
          </div>
          <div className="step">
            <div className="step-icon">2</div>
            <h3>Select Any Text</h3>
            <p>Click on any text, image, or PDF</p>
          </div>
          <div className="step">
            <div className="step-icon">3</div>
            <h3>Extract & Use</h3>
            <p>Copy, edit, or export the extracted text</p>
          </div>
        </div>
      </section>
      
      {/* Plans Section */}
      <section className="plans-section">
        <div className="section-header">
          <h2>Choose Your <span className="gradient-text">Plan</span></h2>
          <p>Select the package that fits your needs</p>
        </div>
        
        <div className="plans-container">
          {plans.map((plan) => (
            <div key={plan.id} className={`plan-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="popular-tag">Most Popular</div>}
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price">
                <span className="currency">$</span>
                <span className="amount">{plan.price}</span>
                <span className="period">/month</span>
              </div>
              
              <ul className="plan-features">
                {plan.features.map((feature, index) => (
                  <li key={index}>
                    <svg className="check-icon" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button 
                className={`plan-btn ${plan.popular ? 'plan-btn-popular' : ''}`}
                onClick={() => navigate('/plans')}
              >
                {plan.price === 0 ? 'Start Free' : 'Choose Plan'}
              </button>
            </div>
          ))}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Extract Text <span className="gradient-text">Like a Pro?</span></h2>
          <p>Join thousands of users who save time with SelectText</p>
          <a 
            href="https://chrome.google.com/webstore/detail/selecttextexe/lamomcdfocoklbenmamelleakhmpodge" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="add-chrome-btn"
          >
            <svg className="chrome-icon" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="#FFF" />
              <circle cx="12" cy="12" r="4" fill="#4285F4" />
              <path d="M12 6V12L15 15" stroke="#EA4335" strokeWidth="2" />
              <path d="M12 12L9 18" stroke="#FBBC05" strokeWidth="2" />
              <path d="M12 12L18 9" stroke="#34A853" strokeWidth="2" />
            </svg>
            Add to Chrome Now
          </a>
        </div>
      </section>
    </div>
  );
};

export default Home; 