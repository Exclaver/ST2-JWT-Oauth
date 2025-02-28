import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const EXTENSION_ID = 'lamomcdfocoklbenmamelleakhmpodge'; // Add extension ID

  const handleLogoutConfirm = async () => {
    try {
      // First notify extension to logout
      if (chrome?.runtime?.sendMessage) {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            EXTENSION_ID,
            { 
              action: 'storeAuthData', 
              token: null, 
              user: null 
            },
            (response) => {
              console.log('Extension notified of logout');
              resolve();
            }
          );
        });
      }

      // Clear local storage
      localStorage.removeItem('oauth_token');
      localStorage.removeItem('user');
      
      // Handle website logout
      await logout();
      
      // Close modal and redirect
      setShowLogoutConfirm(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };
  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">SelectText</Link>
      </div>
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/plans">Plans</Link></li>
        <li><Link to="/tutorial">Tutorial</Link></li>
        {!isAuthenticated ? (
          <li><Link to="/login_signup">Login/Signup</Link></li>
        ) : (
          <>
            <li><Link to="/account">Account</Link></li>
            <li><button className="logout-btn" onClick={handleLogoutClick}>Logout</button></li>
          </>
        )}
      </ul>
      {showLogoutConfirm && (
        <div className="logout-confirm-overlay">
          <div className="logout-confirm-modal">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className="logout-confirm-buttons">
              <button className="confirm-btn" onClick={handleLogoutConfirm}>Yes, Logout</button>
              <button className="cancel-btn" onClick={handleLogoutCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;