import React, { useState } from 'react';
import '../styles/Tutorial.css';
const YOUTUBE_DEMO_ID = import.meta.env.VITE_YOUTUBE_DEMO_ID;
const EXTENSION_URL = import.meta.env.VITE_CHROME_STORE_URL;

const Tutorial = () => {
  

  return (
    <div className="tutorial-page">
      <div className="gradient-bg"></div>

      {/* Video Section */}
      <section className="tutorial-hero">
        <h1>YouTube Text Extraction <span className="gradient-text">Extension</span></h1>
        <div className="video-container">
        <iframe 
          src={`https://www.youtube.com/embed/${YOUTUBE_DEMO_ID}?autoplay=1&rel=0&mute=1`}
          title="YouTube Text Extraction Tutorial"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        </div>
      </section>

      <div className="documentation">
        {/* Getting Started */}
        <div className="doc-section">
          <h2>1. Getting Started</h2>
          <div className="doc-content">
            <h3>Installation</h3>
            <ul>
              <li>Open Google Chrome and visit the Chrome Web Store</li>
              <li>Search for YouTube Textify or click here (insert link)</li>
              <li>Click the Add to Chrome button and confirm the installation</li>
            </ul>
            
            <h3>Initial Setup Process</h3>
            <ul>
              <li>Click on the extension icon in your Chrome toolbar</li>
              <li>Grant necessary permissions to allow text extraction</li>
              <li>Log in or create an account to access advanced features</li>
            </ul>
            
            <h3>Account Creation</h3>
            <p><strong>Why create an account?</strong></p>
            <ul>
              <li>Sync extractions across devices</li>
              <li>Access 25 free OCR extractions every month</li>
              <li>Track usage and manage your credit balance</li>
            </ul>
            
            <p><strong>To create an account:</strong></p>
            <ul>
              <li>Click on the Sign Up button</li>
              <li>Enter your email and create a password</li>
              <li>Verify your email and log in</li>
            </ul>
            
            <h3>Web App & Extension Integration</h3>
            <ul>
              <li>Your account is shared between the web app and the extension</li>
              <li>View extraction history, manage credits, and upgrade plans from the web app</li>
            </ul>
          </div>
        </div>

        {/* Text Extraction Methods */}
        <div className="doc-section">
          <h2>2. Text Extraction Methods</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Selection Tools</h3>
              <div className="code-example">
                <ul>
                  <li>Click & Drag: Select text manually</li>
                  <li>Auto-Detect: Extract from subtitles</li>
                  <li>Advanced Selection: Works on full-screen</li>
                </ul>
              </div>
            </div>
            <div className="feature-card">
              <h3>Copy Styles</h3>
              <div className="code-example">
                <ul>
                  <li>Multiline Mode: Line by line text</li>
                  <li>Single Line Mode: Continuous text</li>
                  <li>Indent Mode: Preserves formatting</li>
                </ul>
              </div>
            </div>
            <div className="feature-card">
              <h3>Display Options</h3>
              <div className="code-example">
                <ul>
                  <li>Transparent Background: See video</li>
                  <li>Opaque Background: Better visibility</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* OCR Capabilities */}
        <div className="doc-section">
          <h2>3. OCR Capabilities (Google Cloud Vision API)</h2>
          <div className="doc-content">
            <div className="info-columns">
              <div className="info-col">
                <h3>Text Recognition</h3>
                <ul>
                  <li>Printed Text: Extracts clear text</li>
                  <li>Handwritten Text: Recognizes handwriting</li>
                  <li>Low-Quality Text: Works with blurry text</li>
                </ul>
              </div>
              <div className="info-col">
                <h3>Multi-Language Support</h3>
                <ul>
                  <li>Supports 100+ languages</li>
                  <li>Automatic language detection</li>
                  <li>Mixed language processing</li>
                </ul>
              </div>
              <div className="info-col">
                <h3>Document Features</h3>
                <ul>
                  <li>Layout Preservation</li>
                  <li>Table Recognition</li>
                  <li>Document structure retention</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Screenshots & Image Processing */}
        <div className="doc-section">
          <h2>4. Screenshots & Image Processing</h2>
          <div className="language-support">
            <div className="info-columns">
              <div className="info-col">
                <h3>Capture Methods</h3>
                <ul>
                  <li>Full-Screen Screenshot: Capture the entire YouTube video screen</li>
                  <li>Unlimited Downloads: Save as many screenshots as you need</li>
                </ul>
              </div>
              <div className="info-col">
                <h3>Image Manipulation</h3>
                <ul>
                  <li>Cropping: Remove unwanted sections before extracting text</li>
                  <li>Zoom: Focus on specific text areas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Credit System & Plans */}
        <div className="doc-section">
          <h2>5. Credit System & Plans</h2>
          <div className="doc-content">
            <h3>Understanding Credits</h3>
            <ul>
              <li>1 credit = 1 OCR extraction or toggle use</li>
              <li>Free credits reset every month</li>
              <li>Track usage from the web app or the extension settings</li>
            </ul>
            
            <h3>Credit Regeneration</h3>
            <ul>
              <li>Free Plan: 25 OCR extractions per month</li>
              <li>Credits reset on the 1st of each month</li>
            </ul>
            
            <div className="plans-grid">
              <div className="plan-info">
                <h3>Free Trial</h3>
                <ul>
                  <li>25 OCR requests/month</li>
                  <li>Unlimited screenshots</li>
                  <li>$0</li>
                </ul>
              </div>
              <div className="plan-info">
                <h3>Basic Plan</h3>
                <ul>
                  <li>500 OCR requests/month</li>
                  <li>Unlimited screenshots</li>
                  <li>$3/month</li>
                </ul>
              </div>
              <div className="plan-info highlight">
                <h3>Pro Plan</h3>
                <ul>
                  <li>1200 OCR requests/month</li>
                  <li>Early access to new features</li>
                  <li>$5/month</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="doc-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3>How do credits work?</h3>
              <p>One credit per OCR extraction. Credits reset monthly, and paid plans include more credits.</p>
            </div>
            <div className="faq-item">
              <h3>Can I use it offline?</h3>
              <p>No, OCR features require internet connection.</p>
            </div>
            
            <div className="faq-item">
              <h3>Does this work on all videos?</h3>
              <p>Yes, our extension works on all YouTube videos and even most streaming platforms.</p>
            </div>
          </div>
        </div>
        
        {/* Call to Action */}
        <div className="doc-section cta-section">
  <h2>Start Using YouTube Text Extraction Today!</h2>
  <p>Download the extension and experience seamless text extraction from YouTube videos. 🚀</p>
  <a 
    href={EXTENSION_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="cta-button"
  >
    <img 
      src="https://www.google.com/favicon.ico" 
      alt="Chrome" 
      className="chrome-icon" 
    />
    Download Extension
  </a>
</div>
      </div>
    </div>
  );
};

export default Tutorial;