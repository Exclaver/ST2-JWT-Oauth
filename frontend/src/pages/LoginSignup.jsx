import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import ExtensionBridge from '../components/ExtensionBridge';

const CLIENT_ID = '963962857620-ub5qr7ogishs3j4i2hui1jsua3ahjm94.apps.googleusercontent.com';

const LoginSignup = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSuccess = async (credentialResponse) => {
    try {
      const response = await authAPI.login({
        access_token: credentialResponse.credential
      });
  
      if (response.user && response.tokens) {
        login(response.user);
        setIsLoggedIn(true);
        setError(null);
        setTimeout(() => navigate('/account'), 2000);
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  const onError = () => {
    console.log('Login Failed');
    setError('Login failed. Please try again.');
  };

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className="container">
        {!isLoggedIn ? (
          <>
            <h1>Sign in with Google</h1>
            {error && <div className="error-message">{error}</div>}
            <div className="google-login-container">
              <GoogleLogin
                onSuccess={onSuccess}
                onError={onError}
                useOneTap
              />
            </div>
          </>
        ) : (
          <div className="success-message">
            <h1>Sign in Successful!</h1>
            <p>Welcome back!</p>
            <p>Redirecting to your account...</p>
          </div>
        )}
      </div>
      <ExtensionBridge />
    </GoogleOAuthProvider>
  );
};

export default LoginSignup;