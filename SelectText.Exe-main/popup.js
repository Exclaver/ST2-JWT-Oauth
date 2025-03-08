function fetchCredits() {
  chrome.storage.local.get(['access_token'], function(result) {
    if (!result.access_token) return;
    const creditsCount = document.getElementById('creditsCount');
    fetch('http://localhost:8000/api/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${result.access_token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.plan && typeof data.plan.credits_remaining !== 'undefined') {
        creditsCount.textContent = `${data.plan.credits_remaining}/${data.plan.credits_total}`;
        const tooltipText = `Used: ${data.plan.credits_used}\nPlan: ${data.plan.name}`;
        creditsCount.title = tooltipText;
      } else {
        creditsCount.textContent = 'N/A';
      }
    })
    .catch(error => {
      console.error('Error fetching credits:', error);
      creditsCount.textContent = 'Error';
    });
  });
}
document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get(['isAuthenticated', 'access_token', 'copyStyle','displayStyle'], function(result) {
    if (!result.isAuthenticated || !result.access_token) {
      window.location.href = 'login.html';
      return;
    }

    const upgradeButton = document.getElementById("upgradeButton");
    upgradeButton.addEventListener("click", function() {
      chrome.tabs.create({ url: 'http://localhost:5173/plans' });
    });

    fetchCredits();
    const savedStyle = result.copyStyle || 'multiline';
    const radioButton = document.querySelector(`input[value="${savedStyle}"]`);
    if (radioButton) {
      radioButton.checked = true;
    }
    const savedDisplayStyle = result.displayStyle || 'opaque';
    const displayRadioButton = document.querySelector(`input[name="displayStyle"][value="${savedDisplayStyle}"]`);
    if (displayRadioButton) {
      displayRadioButton.checked = true;
    }

    const screenshotButton = document.getElementById("screenshotButton");
    const accountButton = document.getElementById("accountButton");
    const downloadButton = document.getElementById("downloadButton");
    const screenshotContainer = document.getElementById("screenshotContainer");
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

    // Display style change listener
    document.querySelectorAll('input[name="displayStyle"]').forEach(radio => {
      radio.addEventListener('change', function(e) {
        const newStyle = e.target.value;
        chrome.storage.local.set({ displayStyle: newStyle }, () => {
          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { 
              action: "updateDisplayStyle", 
              style: newStyle
            });
          });
        });
      });
    });
    // Account button click handler
    accountButton.addEventListener("click", function() {
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
    downloadButton.style.display = "none"; // Initially hide download button
    screenshotContainer.style.display = "none";

    screenshotButton.addEventListener("click", function () {
      // Add loading state
      screenshotButton.textContent = "Taking screenshot...";
      screenshotButton.disabled = true;
      
      chrome.runtime.sendMessage(
        { action: "takeScreenshot" },
        function (response) {
          // Reset button state
          screenshotButton.textContent = "Take Screenshot";
          screenshotButton.disabled = false;
          
          if (response && response.screenshot) {
            const screenshotImage = document.getElementById("screenshotImage");
            screenshotImage.src = response.screenshot;
            currentScreenshot = response.screenshot;
            downloadButton.style.display = "block";
            screenshotContainer.style.display = "block";
            
            setTimeout(() => {
              screenshotContainer.style.transition = "all 0.3s ease-in-out";
              screenshotContainer.style.opacity = "1";
              screenshotContainer.style.maxHeight = "300px";
            }, 10);
          }
        }
      );
    });
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'forceReload') {
      window.location.href = 'login.html';
  }
});