import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api'; // Add this import
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user data exists in localStorage on app load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
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
        
        // Clear local storage
        localStorage.removeItem('oauth_token');
        
        // Update context state
        setState({
            isAuthenticated: false,
            user: null,
            token: null
        });

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
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);