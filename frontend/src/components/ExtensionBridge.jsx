import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ExtensionBridge = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const EXTENSION_ID = 'lamomcdfocoklbenmamelleakhmpodge';

  const sendAuthToExtension = (user, tokens) => {
    try {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        {
          action: 'storeAuthData',
          token: tokens.access,
          refreshToken: tokens.refresh,
          user: user
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('Auth data send error:', chrome.runtime.lastError);
            return;
          }
          console.log('Auth data sent successfully:', response);
        }
      );
    } catch (error) {
      console.error('Error sending auth data:', error);
    }
  };

  // Extension message listeners
  useEffect(() => {
    window.addEventListener('message', handleExtensionMessage);
    if (chrome?.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleExtensionDirectMessage);
    }

    return () => {
      window.removeEventListener('message', handleExtensionMessage);
      if (chrome?.runtime?.onMessage) {
        chrome.runtime.onMessage.removeListener(handleExtensionDirectMessage);
      }
    };
  }, []);

  // Handle user state changes
  useEffect(() => {
    if (!user) {
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { 
            action: 'storeAuthData', 
            token: null, 
            user: null 
          },
          (response) => {
            console.log('Extension notified of logout:', response);
          }
        );
      }
    } else {
      // Get tokens from sessionStorage when user is available
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (accessToken) {
        sendAuthToExtension(user, {
          access: accessToken,
          refresh: refreshToken
        });
      }
    }
  }, [user]);

  const handleExtensionDirectMessage = (request, sender, sendResponse) => {
    if (request.action === 'logoutWebsite') {
      handleLogout();
      sendResponse({ success: true });
    }
  };

  const handleExtensionMessage = (event) => {
    if (event.data.type === 'EXTENSION_LOGOUT') {
      handleLogout();
    }
  };

  const handleLogout = async () => {
    try {
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
              console.log('Extension storage cleared:', response);
              resolve();
            }
          );
        });
      }
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return null;
};

export default ExtensionBridge;