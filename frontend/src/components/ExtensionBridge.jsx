import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ExtensionBridge = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID;

  const sendAuthToExtension = (user, tokens) => {
    if (!chrome?.runtime?.sendMessage) return;

    chrome.runtime.sendMessage(
      EXTENSION_ID,
      {
        action: 'storeAuthData',
        token: tokens.access,
        refreshToken: tokens.refresh,
        user: user
      },
      () => {
        if (chrome.runtime.lastError) return;
      }
    );
  };

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

  useEffect(() => {
    if (!chrome?.runtime?.sendMessage) return;

    if (!user) {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        { 
          action: 'storeAuthData', 
          token: null, 
          user: null 
        }
      );
    } else {
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
            () => resolve()
          );
        });
      }
      await logout();
      navigate('/');
    } catch (error) {
      // Silent fail in production
    }
  };

  return null;
};

export default ExtensionBridge;