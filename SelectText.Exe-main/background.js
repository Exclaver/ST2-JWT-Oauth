// background.js
const CLIENT_ID = encodeURIComponent('963962857620-ub5qr7ogishs3j4i2hui1jsua3ahjm94.apps.googleusercontent.com');
const RESPONSE_TYPE = encodeURIComponent('id_token');
const REDIRECT_URI = encodeURIComponent('https://lamomcdfocoklbenmamelleakhmpodge.chromiumapp.org');
const STATE = encodeURIComponent('fskn3');
const SCOPE = encodeURIComponent('openid email profile');
const PROMPT = encodeURIComponent('consent');

// Initialize extension on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setPopup({ popup: 'login.html' });
    checkAndUpdateAuthState();
});

// Check and update authentication state
function checkAndUpdateAuthState() {
    chrome.storage.local.get(['isAuthenticated'], (result) => {
        if (result.isAuthenticated) {
            chrome.action.setPopup({ popup: 'popup.html' });
            updateBadge(true);
        } else {
            chrome.action.setPopup({ popup: 'login.html' });
            updateBadge(false);
        }
    });
}

// Update extension badge
function updateBadge(isAuthenticated) {
    chrome.action.setBadgeText({ 
        text: isAuthenticated ? '✓' : '' 
    });
    if (isAuthenticated) {
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    }
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openLogin") {
        chrome.action.setPopup({ popup: 'login.html' }, () => {
            chrome.action.openPopup(() => {
                sendResponse({ success: true });
            });
        });
        return true; // Keep message channel open for async response
    }
    // ... rest of your message handling ...
});

// Handle external messages
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    console.log('External message received:', request);

    switch (request.action) {
        case 'storeAuthData':
            handleAuthData(request, sendResponse);
            break;
        case 'login':
            handleLogin(sendResponse);
            break;
        case 'logout':
            handleLogout(sendResponse);
            break;
        case 'checkAuth':
            checkAuthStatus(sendResponse);
            break;
        case 'takeScreenshot':
            takeScreenshot(sendResponse);
            break;
        default:
            sendResponse({ success: false, error: 'Unknown action' });
            return false;
    }
    return true; // Keep message channel open for async response
});


// Handler functions
function handleAuthData(request, sendResponse) {
    console.log('Handling auth data:', request);
    // If token is null, user is logging out
    if (!request.token) {
        chrome.storage.local.clear(() => {
            chrome.action.setPopup({ popup: 'login.html' });
            updateBadge(false);
            // Force reload any open popup
            chrome.runtime.sendMessage({ action: 'forceReload' });
            console.log('Extension storage cleared');
            sendResponse({ success: true });
        });
    } else {
        // Handle login case
        chrome.storage.local.set({
            isAuthenticated: true,
            access_token: request.token,
            refresh_token: request.refreshToken,
            user: request.user
        }, () => {
            chrome.action.setPopup({ popup: 'popup.html' });
            updateBadge(true);
            sendResponse({ success: true });
        });
    }
    return true;
}
function handleLogin(sendResponse) {
    chrome.tabs.create({ 
        url: WEBSITE_LOGIN_URL 
    }, (tab) => {
        console.log('Login tab created');
        sendResponse({ success: true });
    });
}

function handleLogout(sendResponse) {
    console.log('Handling logout request');
    resetExtensionState();
    sendResponse({ success: true });
    return true; // Keep message channel open for async response
}

function resetExtensionState() {
    chrome.storage.local.clear(() => {
        chrome.storage.local.set({
            isAuthenticated: false,
            token: null,
            user: null
        }, () => {
            chrome.action.setPopup({ popup: 'login.html' });
            updateBadge(false);
            // Force reload any open popup
            chrome.runtime.sendMessage({ action: 'forceReload' });
        });
    });
}
function checkAuthStatus(sendResponse) {
    chrome.storage.local.get(['isAuthenticated', 'token', 'user'], (result) => {
        sendResponse({
            isAuthenticated: result.isAuthenticated || false,
            token: result.token || null,
            user: result.user || null
        });
    });
}

function takeScreenshot(sendResponse) {
    chrome.tabs.captureVisibleTab(null, { format: "jpeg" }, (dataUrl) => {
        if (chrome.runtime.lastError) {
            sendResponse({ 
                success: false, 
                error: chrome.runtime.lastError.message 
            });
            return;
        }
        sendResponse({ success: true, screenshot: dataUrl });
    });
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "takeScreenshot") {
      chrome.tabs.captureVisibleTab(null, { format: "jpeg" }, function (dataUrl) {
        sendResponse({ screenshot: dataUrl });
      });
      return true; // Required to keep the message channel open for sendResponse
    }
  });