document.addEventListener("DOMContentLoaded", function () {
  // Check auth status first
  chrome.storage.local.get(['isAuthenticated','access_token'], function(result) {
    if (!result.isAuthenticated || !result.access_token) {
      // Redirect to login.html if not authenticated
      window.location.href = 'login.html';
      return;
    }
    
    const screenshotButton = document.getElementById("screenshotButton");
    const toggleButton = document.getElementById("toggleButton");
    

    screenshotButton.addEventListener("click", function () {
      chrome.runtime.sendMessage(
        { action: "takeScreenshot" },
        function (response) {
          if (response && response.screenshot) {
            const screenshotImage = document.getElementById("screenshotImage");
            screenshotImage.src = response.screenshot;
    
            // Get authentication token
            chrome.storage.local.get(['access_token'], function(authResult) {
              console.log('Token check:', {
                hasToken: !!authResult.access_token,
                tokenStart: authResult.access_token ? authResult.access_token.substring(0, 20) : null
              });
              
              if (!authResult.access_token) {
                console.error('No authentication token found');
                return;
              }
    
              // Send to backend for OCR processing
              fetch('http://localhost:8000/api/ocr/process/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authResult.access_token}`
                },
                body: JSON.stringify({
                  image: response.screenshot
                }),
                credentials: 'include'
              })
              .then(response => response.json())
              .then(responseData => {
                if (responseData.error) {
                  console.error('OCR processing error:', responseData.error);
                } else if (responseData.responses && responseData.responses[0] && responseData.responses[0].textAnnotations) {
                  const words = responseData.responses[0].textAnnotations.slice(1).map((annotation) => ({
                    text: annotation.description,
                    y: annotation.boundingPoly.vertices[0].y,
                    x: annotation.boundingPoly.vertices[0].x,
                    height: annotation.boundingPoly.vertices[2].y - annotation.boundingPoly.vertices[0].y,
                    width: annotation.boundingPoly.vertices[2].x - annotation.boundingPoly.vertices[0].x,
                  }));
                  
                  chrome.tabs.query(
                    { active: true, currentWindow: true },
                    function (tabs) {
                      chrome.scripting.executeScript(
                        {
                          target: { tabId: tabs[0].id },
                          files: ["content.js"],
                        },
                        () => {
                          chrome.tabs.sendMessage(tabs[0].id, {
                            action: "overlayWords",
                            boxes: words,
                          });
                        }
                      );
                    }
                  );
                }
              })
              .catch(error => {
                console.error('Error with OCR processing:', error);
              });
            });
          }
        }
      );
    });

    toggleButton.addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggleText" });
      });
    });
  });
});
// Add this to your existing popup.js event listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'forceReload') {
      window.location.href = 'login.html';
  }
});