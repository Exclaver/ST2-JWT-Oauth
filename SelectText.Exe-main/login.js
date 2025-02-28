document.addEventListener('DOMContentLoaded', function() {
    const loginContainer = document.querySelector('.login-container');
    const oauthBtn = document.getElementById('oauthBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Initial auth check
    checkAuthStatus();
    chrome.storage.local.get(['isAuthenticated', 'token'], function(result) {
        if (result.isAuthenticated && result.token) {
            window.location.href = 'popup.html';
        }
    });
    // Event Listeners
    if (oauthBtn) {
        oauthBtn.addEventListener('click', () => {
            // Direct redirection to website login page
            chrome.tabs.create({
                url: 'http://localhost:5173/login_signup?source=extension&auto_login=true'
            });
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && (changes.isAuthenticated || changes.token)) {
            checkAuthStatus();
        }
    });

    // Handler Functions
    function handleLogin() {
        chrome.runtime.sendMessage({ action: "login" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Login error:', chrome.runtime.lastError);
                return;
            }
            console.log('Login initiated:', response);
        });
    }

    function handleLogout() {
        // First clear extension storage
        chrome.storage.local.clear(() => {
            // Then logout from website
            fetch('http://localhost:8000/api/auth/logout/', {
                method: 'POST',
                credentials: 'include'
            })
            .then(() => {
                // Clear website localStorage
                chrome.tabs.query({}, function(tabs) {
                    tabs.forEach(tab => {
                        if (tab.url.includes('localhost:5173')) {
                            chrome.tabs.sendMessage(tab.id, { action: 'logoutWebsite' });
                        }
                    });
                });
                
                // Reset extension UI
                updateUI(false);
                window.location.href = 'login.html';
            })
            .catch(error => console.error('Logout error:', error));
        });
    }

    function checkAuthStatus() {
        chrome.storage.local.get(['isAuthenticated', 'token', 'user'], (result) => {
            console.log('Auth status:', result.isAuthenticated);
            
            if (result.isAuthenticated) {
                window.location.href = 'popup.html';
            } else {
                updateUI(false);
            }
        });
    }

    function updateUI(isAuthenticated) {
        if (oauthBtn && logoutBtn) {
            oauthBtn.style.display = isAuthenticated ? 'none' : 'block';
            logoutBtn.style.display = isAuthenticated ? 'block' : 'none';
        }
        loginContainer.classList.toggle('authenticated', isAuthenticated);
    }
});