import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

const EXTENSION_URL = import.meta.env.VITE_CHROME_STORE_URL;
const YOUTUBE_DEMO_ID = import.meta.env.VITE_YOUTUBE_DEMO_ID;
const GITHUB_PROFILE = import.meta.env.VITE_GITHUB_PROFILE;
const TWITTER_PROFILE = import.meta.env.VITE_TWITTER_PROFILE;
const EMAIL_ID=import.meta.env.VITE_EMAIL_ID;
const FEEDBACK_FORM=import.meta.env.VITE_FEEDBACK_FORM;

const Home = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([
    {
      id: 1,
      name: "Free",
      price: 0,
      features: ["25 Credits/Month", "Advanced Text Extraction","Screenshot Capture"],
      popular: false
    },
    {
      id: 2,
      name: "Basic",
      price: 3.00,
      features: ["600 Credits/Month", "Advanced Text Extraction", "Priority Support", "Screenshot Capture"],
      popular: false
    },
    {
      id: 3,
      name: "Pro",
      price: 5.00,
      features: ["1200 Credits/Month", "Advanced Text Extraction", "24/7 Support","early access of upcoming features"],
      popular: true
    }
  ]);

  return (
    <div className="home-container">
      <div className="gradient-bg"></div>
      
      {/* Hero Section */}
      <section className="hero">
  <div className="hero-content">
    <h1>Extract Any Text with <span className="gradient-text">One Click</span></h1>
    <p className="subtitle">The ultimate Chrome extension for seamlessly extracting text from any Youtube video, Handwritten, or Typed</p>
    
    <a 
      href={EXTENSION_URL}
      target="_blank" 
      rel="noopener noreferrer" 
      className="add-chrome-btn"
    >
      <img src="https://www.google.com/favicon.ico" alt="Google" className="chrome-icon" />
      Add to Chrome - It's Free
    </a>
    
    {/* New Feature Highlights */}
    <div className="hero-features">
      <div className="hero-feature">
        <div className="hero-feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <span>3 Copy Modes - Line, Multiline & Indent</span>
      </div>
      
      <div className="hero-feature">
        <div className="hero-feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        </div>
        <span>100+ Languages Support with Auto-detection</span>
      </div>
      
      <div className="hero-feature">
        <div className="hero-feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 18l-4-4h8l-4 4z" />
            <path d="M12 6l4 4H8l4-4z" />
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        </div>
        <span>Chrome <span className="supported-tag">Available</span> • Firefox & Edge <span className="coming-soon-tag">Coming Soon</span></span>
      </div>
    </div>
    
    <div className="stats">
      <div className="stat">
        <span className="stat-number">1000+</span>
        <span className="stat-label">Users</span>
      </div>
      <div className="stat">
        <span className="stat-number">4.8</span>
        <span className="stat-label">Rating</span>
      </div>
      <div className="stat">
        <span className="stat-number">400+</span>
        <span className="stat-label">Extractions</span>
      </div>
    </div>
  </div>
  
  {/* Replace image with video */}
  <div className="hero-video">
    <iframe 
      src={`https://www.youtube.com/embed/${YOUTUBE_DEMO_ID}?autoplay=1&mute=1&rel=0`}
      frameBorder="0" 
      title="Textify Demo" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowFullScreen
    ></iframe>
    <div className="video-glow"></div>
  </div>
</section>

       {/* New Copy Modes Section */}
       <section className="copy-modes-section">
        <div className="section-header">
          <h2>3 <span className="gradient-text">Copy Modes</span> for Every Need</h2>
          <p>Extract text exactly how you want it with our specialized copy modes</p>
        </div>
        
        <div className="copy-modes-container">
          <div className="copy-mode-card">
            <div className="copy-mode-header">
              <div className="copy-mode-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </div>
              <h3>Line Mode</h3>
            </div>
            <div className="copy-mode-example">
              <code>hello how are you</code>
            </div>
            <p>Perfect for extracting single-line text without line breaks</p>
          </div>
          
          <div className="copy-mode-card">
            <div className="copy-mode-header">
              <div className="copy-mode-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h10M4 12h16M4 17h5" />
                </svg>
              </div>
              <h3>Multiline Mode</h3>
            </div>
            <div className="copy-mode-example">
              <code>Developer of Textify<br/>is THE best </code>
            </div>
            <p>Preserves paragraph structure with line breaks</p>
          </div>
          
          <div className="copy-mode-card">
            <div className="copy-mode-header">
              <div className="copy-mode-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h16M8 12h12M12 17h8" />
                 </svg>
              </div>
              <h3>Indent Mode</h3>
      </div>
  <div className="copy-mode-example code-example">
    <pre>{`return (
  <div style={{display:"flex"}}>
    <h2>useState vs useRef</h2>
      Increment State
    </button>
  </div>
);`}</pre>
  </div>
  <p>Maintains code indentation for developers</p>
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
      {/* Key Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>Powerful <span className="gradient-text">Features</span></h2>
          <p>Everything you need for seamless text extraction</p>
        </div>
        
        <div className="home-features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3>3 Copy Modes</h3>
            <p>Line, Multiline, and Indent modes for coders with 100% accuracy</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 18l-4-4h8l-4 4z" />
                <path d="M12 6l4 4H8l4-4z" />
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
            </div>
            <h3>Browser Support</h3>
            <p>Chrome <span className="supported-tag">Available</span></p>
            <p>Firefox <span className="coming-soon-tag">Coming Soon</span></p>
            <p>Edge <span className="coming-soon-tag">Coming Soon</span></p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3>Website Support</h3>
            <p>Youtube <span className="supported-tag">Available</span></p>
            <p>Udemy <span className="coming-soon-tag">Coming Soon</span></p>
            <p>Coursera <span className="coming-soon-tag">Coming Soon</span></p>

          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <h3>100+ Languages</h3>
            <p>Support for over 100 languages with auto-detection and Mixed Language Support</p>
          </div>
          
          <div className="feature-card feature-highlight">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3>Fastest OCR</h3>
            <p>Industry-leading speed and accuracy for text extraction</p>
          </div>
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
          src={`https://www.youtube.com/embed/${YOUTUBE_DEMO_ID}?autoplay=0&rel=0`}
          title="Textify Tutorial" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
        </div>
        
      
      </section>
      
      
      
      {/* CTA Section */}
      {/* Footer Section (replacing CTA) */}
<footer className="footer-section">
  <div className="footer-content">
    <div className="footer-main">
      <div className="footer-brand">
        <h3>Textify<span className="gradient-text">.Exe</span></h3>
        <p>The ultimate Chrome extension for seamlessly extracting text from any Video or image</p>
        
        <a 
          href={EXTENSION_URL} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="footer-cta-btn"
        >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="chrome-icon" />

          Add to Chrome
        </a>
      </div>
      
      <div className="footer-links">
        <div className="footer-links-column">
          <h4>Product</h4>
          <ul>
            <li><a href="/plans">Pricing</a></li>
            <li><a href="/tutorial">How it Works</a></li>
            <li><a href={FEEDBACK_FORM}>Report a Bug</a></li>

            <li><a href="/tutorial">FAQ</a></li>
          </ul>
        </div>
        
        
        
        <div className="footer-links-column">
          <h4>Contact</h4>
          <ul>
            <li><a href={EMAIL_ID}>textifyofficial@gmail.com</a></li>
            
            <li><a href={TWITTER_PROFILE} target="_blank" rel="noopener noreferrer">Twitter</a></li>
            <li><a href={GITHUB_PROFILE}target="_blank" rel="noopener noreferrer">GitHub</a></li>
          </ul>
        </div>
      </div>
    </div>
    
    <div className="footer-bottom">
      <div className="copyright">
        &copy; {new Date().getFullYear()} Textify. All rights reserved.
      </div>
      <div className="developer">
        Made with <span className="heart">♥</span> by <a href={GITHUB_PROFILE} target="_blank" rel="noopener noreferrer">Devansh Matha</a>
      </div>
    </div>
  </div>
</footer>
    </div>
  );
};

export default Home;