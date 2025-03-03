import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // Add scroll effect for navbar
  useEffect(() => {
    const navbar = document.querySelector('.navbar');
    const handleScroll = () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">Textify</Link>
      </div>
      
      <button className="menu-toggle" aria-label="Toggle menu" onClick={toggleMenu}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 12H21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <path d="M3 6H21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <path d="M3 18H21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
      
      <ul className={`navbar-links ${menuOpen ? 'active' : ''}`}>
        {menuOpen && (
          <button className="close-menu" onClick={toggleMenu} aria-label="Close menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        
        <li style={{"--i": 1}}>
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            Home
          </NavLink>
        </li>
        <li style={{"--i": 2}}>
          <NavLink to="/Tutorial" className={({ isActive }) => isActive ? 'active' : ''}>
            Tutorial
          </NavLink>
        </li>
        <li style={{"--i": 3}}>
          <NavLink to="/plans" className={({ isActive }) => isActive ? 'active' : ''}>
            Pricing
          </NavLink>
        </li>
        {user ? (
          <>
            <li style={{"--i": 4}}>
              <NavLink to="/account" className={({ isActive }) => isActive ? 'active' : ''}>
                My Account
              </NavLink>
            </li>
            <li style={{"--i": 5}}>
              <button className="logout-btn" onClick={handleLogoutClick}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <li style={{"--i": 4}}>
            <NavLink to="/login_signup" className={({ isActive }) => isActive ? 'active' : ''}>
              Login
            </NavLink>
          </li>
        )}
      </ul>

      {showLogoutConfirm && (
        <div className="logout-confirm-overlay">
          <div className="logout-confirm-modal">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out of your account?</p>
            <div className="logout-confirm-buttons">
              <button className="confirm-btn" onClick={handleLogoutConfirm}>
                Yes, Logout
              </button>
              <button className="cancel-btn" onClick={handleLogoutCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;