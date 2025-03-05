document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get(['isAuthenticated', 'access_token', 'copyStyle'], function(result) {
    if (!result.isAuthenticated || !result.access_token) {
      window.location.href = 'login.html';
      return;
    }

    const savedStyle = result.copyStyle || 'multiline';
    const radioButton = document.querySelector(`input[value="${savedStyle}"]`);
    if (radioButton) {
      radioButton.checked = true;
    }

    const screenshotButton = document.getElementById("screenshotButton");
    const accountButton = document.getElementById("accountButton"); // Changed from profileIcon
    const downloadButton = document.getElementById("downloadButton");
    let currentScreenshot = null;

    // Copy style change listener
    document.querySelectorAll('input[name="copyStyle"]').forEach(radio => {
      radio.addEventListener('change', function(e) {
        const newStyle = e.target.value;
        chrome.storage.local.set({ copyStyle: newStyle }, () => {
          console.log('Copy style saved:', newStyle);
          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { 
              action: "updateCopyStyle", 
              style: newStyle
            });
          });
        });
      });
    });

    // Account button click handler
    accountButton.addEventListener("click", function() { // Changed from profileIcon
        window.open('http://localhost:5173/account/', '_blank');
    });   
    downloadButton.addEventListener("click", function() {
      if (currentScreenshot) {
        // Create temporary link for download
        const link = document.createElement('a');
        link.href = currentScreenshot;
        link.download = `screenshot-${new Date().toISOString()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }); 


    screenshotButton.addEventListener("click", function () {
      chrome.runtime.sendMessage(
        { action: "takeScreenshot" },
        function (response) {
          if (response && response.screenshot) {
            const screenshotImage = document.getElementById("screenshotImage");
            screenshotImage.src = response.screenshot;
            currentScreenshot = response.screenshot;
            downloadButton.style.display = 'block'; // Show download button
          }
        }
      );
    });
  });
});
// Add this to your existing popup.js event listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'forceReload') {
      window.location.href = 'login.html';
  }
});