import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);  // Add loading state

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for token first (this is what API uses for auth)
        const token = localStorage.getItem('access_token');
        
        if (token) {
          // Try to get user profile with token to verify it's valid
          try {
            console.log("Found token, verifying by fetching profile...");
            const userData = await authAPI.getProfile();
            console.log("Token valid, setting user:", userData);
            
            // Set user in state and localStorage
            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(userData));
          } catch (err) {
            console.error("Token invalid:", err);
            // Token invalid, clear everything
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
          }
        } else {
          console.log("No access token found");
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setLoading(false);  // Always mark loading as complete
      }
    };

    initAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
   
  };

  const logout = async () => {
    try {
      // Logout from backend
      await authAPI.logout();
      
      // Clear all auth data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // Update context state
      setIsAuthenticated(false);
      setUser(null);

      // Notify extension
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage(
          'lamomcdfocoklbenmamelleakhmpodge',
          { action: 'logout' }
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated,
      loading,  // Export loading state
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);