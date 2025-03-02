import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { isAuthenticated } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">Textify</Link>
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
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;