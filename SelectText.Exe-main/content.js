let textVisible = true;
let hasProcessedOCR = false;
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let selectionOverlay = null;
let isSignInPopupVisible = false;
let protectiveOverlay = null;

function toggleProtectiveOverlay(video, show) {
  // Remove existing overlay if any
  if (protectiveOverlay) {
    protectiveOverlay.remove();
    protectiveOverlay = null;
  }
  
  if (show) {
    const videoRect = video.getBoundingClientRect();
    
    // Find the toggle switch container
    const toggleContainer = video.parentElement.querySelector('.container');
    
    // Create our overlay
    protectiveOverlay = document.createElement('div');
    
    Object.assign(protectiveOverlay.style, {
      position: 'absolute',
      top: videoRect.top + 'px',
      left: videoRect.left + 'px',
      width: videoRect.width + 'px',
      height: videoRect.height + 'px',
      zIndex: '999997',
      background: 'transparent',
      cursor: 'text',
      pointerEvents: 'none' // Keep pointer events disabled on the overlay
    });
    
    // Store original video pointer-events style
    video.dataset.originalPointerEvents = video.style.pointerEvents || '';
    
    // Disable pointer events on the video
    video.style.pointerEvents = 'none';
    
    // Make sure the toggle switch is clickable and stays in the right state
    if (toggleContainer) {
      // Make the toggle and its container clickable
      toggleContainer.style.pointerEvents = 'auto';
      toggleContainer.style.zIndex = '1000002';
      
      // Ensure the checkbox state matches our show parameter
      const toggleInput = toggleContainer.querySelector('input[type="checkbox"]');
      if (toggleInput && !toggleInput.checked) {
        toggleInput.checked = show;
      }
      
      // Make sure all children are clickable too
      const toggleChildren = toggleContainer.querySelectorAll('*');
      toggleChildren.forEach(child => {
        child.style.pointerEvents = 'auto';
      });
    }
    
    document.body.appendChild(protectiveOverlay);
  } else {
    // Restore video's original pointer-events when overlay is removed
    if (video && video.dataset.originalPointerEvents !== undefined) {
      video.style.pointerEvents = video.dataset.originalPointerEvents;
    }
    
    // Make sure toggle switch reflects the current state
    const toggleContainer = video.parentElement.querySelector('.container');
    if (toggleContainer) {
      const toggleInput = toggleContainer.querySelector('input[type="checkbox"]');
      if (toggleInput) {
        toggleInput.checked = false;
      }
    }
    
    // Hide all word overlays since we're turning off
    const wordOverlays = document.querySelectorAll('.word-overlay');
    wordOverlays.forEach(overlay => {
      overlay.style.display = 'none';
    });
    
    // Update global state
    textVisible = false;
  }
}
// Add at the top of content.js
async function checkAuthStatus() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['isAuthenticated', 'access_token'], function(result) {
      console.log('Auth check:', result);
      resolve(result.isAuthenticated === true && !!result.access_token);
    });
  });
}
function initializeTextSelection() {
  const selectionStyles = `
    .selection-overlay {
      position: fixed;
      background: rgba(66, 135, 245, 0.2);
      border: 1px solid #4287f5;
      pointer-events: none;
      z-index: 999998;
    }
  `;
  
  const style = document.createElement('style');
  style.textContent = selectionStyles;
  document.head.appendChild(style);

  document.addEventListener('mousedown', (e) => {
    if (e.button === 0 && textVisible && hasProcessedOCR) {
      isSelecting = true;
      selectionStart = { x: e.clientX, y: e.clientY };
      
      // Create selection overlay
      selectionOverlay = document.createElement('div');
      selectionOverlay.className = 'selection-overlay';
      document.body.appendChild(selectionOverlay);
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (isSelecting && selectionOverlay) {
      const currentPos = { x: e.clientX, y: e.clientY };
      
      // Calculate selection rectangle
      const left = Math.min(selectionStart.x, currentPos.x);
      const top = Math.min(selectionStart.y, currentPos.y);
      const width = Math.abs(currentPos.x - selectionStart.x);
      const height = Math.abs(currentPos.y - selectionStart.y);
      
      // Update selection overlay
      Object.assign(selectionOverlay.style, {
        left: left + 'px',
        top: top + 'px',
        width: width + 'px',
        height: height + 'px'
      });
      
      const selectionBounds = {
        left: left,
        top: top,
        right: left + width,
        bottom: top + height
      };
  
      const wordOverlays = document.querySelectorAll('.word-overlay');
      wordOverlays.forEach(overlay => {
        const rect = overlay.getBoundingClientRect();
        
        if (rect.left < selectionBounds.right &&
            rect.right > selectionBounds.left &&
            rect.top < selectionBounds.bottom &&
            rect.bottom > selectionBounds.top) {
          overlay.style.backgroundColor = '#4287f5';
          overlay.style.color = 'black';
        } else {
          overlay.style.backgroundColor = 'rgb(0, 0, 0)';
          overlay.style.color = 'white';
        }
      });
    }
  });

  document.addEventListener('mouseup', (e) => {
    if (isSelecting && selectionOverlay) {
      e.preventDefault();
      e.stopPropagation();
      
      isSelecting = false;
      
      const selectionBounds = {
        left: parseInt(selectionOverlay.style.left),
        top: parseInt(selectionOverlay.style.top),
        right: parseInt(selectionOverlay.style.left) + parseInt(selectionOverlay.style.width),
        bottom: parseInt(selectionOverlay.style.top) + parseInt(selectionOverlay.style.height)
      };
    
      // Store selected words with their position data
      const selectedWords = [];
      const wordOverlays = document.querySelectorAll('.word-overlay');
      
      wordOverlays.forEach(overlay => {
        const rect = overlay.getBoundingClientRect();
        
        if (rect.left < selectionBounds.right &&
            rect.right > selectionBounds.left &&
            rect.top < selectionBounds.bottom &&
            rect.bottom > selectionBounds.top) {
            
          // Store each word with its position data
          selectedWords.push({
            text: overlay.getAttribute('data-text'),
          line: parseInt(overlay.getAttribute('data-line') || '0'),
          addSpaceBefore: overlay.hasAttribute('data-add-space'),
          y: rect.top,
          x: rect.left
          });
          
          // Highlight the background and change text color
          overlay.style.backgroundColor = '#4287f5';
          const textSpan = overlay.querySelector('.overlay-text');
          if (textSpan) {
            textSpan.style.color = 'black';
          }
        } else {
          overlay.style.backgroundColor = 'rgb(0, 0, 0)';
          const textSpan = overlay.querySelector('.overlay-text');
          if (textSpan) {
            textSpan.style.color = 'white';
          }
        }
      });
  
      if (selectedWords.length > 0) {
        // First, sort words by line and x position
        selectedWords.sort((a, b) => {
          if (a.line !== b.line) return a.line - b.line;
          return a.x - b.x;
        });
        
        // Build text with proper spacing
        let textToCopy = '';
        let currentLine = -1;
        
        selectedWords.forEach(word => {
          // Add newline if this is a new line
          if (word.line !== currentLine) {
            if (currentLine !== -1) {
              textToCopy += '\n';
            }
            currentLine = word.line;
          } else if (word.addSpaceBefore) {
            // Add space if needed and we're on the same line
            textToCopy += ' ';
          }
          
          // Add the word text
          textToCopy += word.text;
        });
        
        // Store video states before copying
        const videos = document.querySelectorAll('video');
        const videoStates = new Map();
        
        videos.forEach(video => {
          videoStates.set(video, {
            wasPaused: video.paused,
            currentTime: video.currentTime
          });
          // Ensure video stays paused
          if (!video.paused) {
            video.pause();
          }
        });
  
        navigator.clipboard.writeText(textToCopy).then(() => {
          // Show feedback
          const feedback = document.createElement('div');
          Object.assign(feedback.style, {
            position: 'fixed',
            left: '50%',
            top: selectionBounds.bottom + 10 + 'px',
            transform: 'translateX(-50%)',
            background: 'black',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '50px',
            zIndex: '1000000',
            opacity: '0',
            transition: 'all 0.7s',
            boxShadow: `
              -10px -10px 20px 0px #5B51D8,
              0 -10px 20px 0px #833AB4,
              10px -10px 20px 0px #E1306C,
              10px 0 20px 0px #FD1D1D,
              10px 10px 20px 0px #F77737,
              0 10px 20px 0px #FCAF45,
              -10px 10px 20px 0px #FFDC80
            `,
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: '14px',
            fontWeight: '500',
            textAlign: 'center'
          });
          feedback.textContent = 'Text copied!';
          document.body.appendChild(feedback);
          
          requestAnimationFrame(() => {
            feedback.style.opacity = '1';
            setTimeout(() => {
              feedback.style.opacity = '0';
              setTimeout(() => feedback.remove(), 200);
            }, 1500);
          });
        });
      }
  
      // Remove selection overlay
      selectionOverlay.remove();
      selectionOverlay = null;
    }
  });
}

// Update the existing processScreenshot function with these changes:
function showCreditExhaustedPopup(video) {
  // Get video position
  const videoRect = video.getBoundingClientRect();
  
  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'credit-popup-wrapper';
  wrapper.style.left = `${videoRect.left}px`;
  wrapper.style.top = `${videoRect.top}px`;
  wrapper.style.width = `${videoRect.width}px`;
  wrapper.style.height = `${videoRect.height}px`;
  
  // Prevent clicks from reaching video
  wrapper.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  // Create popup container
  const popupContainer = document.createElement('div');
  popupContainer.className = 'credit-popup';

  // Message
  const message = document.createElement('div');
  message.className = 'credit-popup-message';
  message.textContent = 'You have used all your free credits.';

  // Link
  const link = document.createElement('a');
  link.className = 'credit-popup-link';
  link.textContent = 'Upgrade Plan';
  link.href = 'http://localhost:5173/plans';
  link.target = '_blank';

  link.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(link.href, '_blank');
  });

  // Close button
  const closeButton = document.createElement('button');
  closeButton.className = 'credit-popup-close';
  closeButton.textContent = '×';
  closeButton.onclick = (e) => {
    e.stopPropagation();
    wrapper.remove();
  };

  // Assemble and add to DOM
  popupContainer.appendChild(closeButton);
  popupContainer.appendChild(message);
  popupContainer.appendChild(link);
  wrapper.appendChild(popupContainer);
  document.body.appendChild(wrapper);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (wrapper.parentNode) {
      wrapper.remove();
    }
  }, 10000);

  return wrapper;
}
// Add this function after showCreditExhaustedPopup function
// Update this part of showSignInPopup:
function showSignInPopup(video) {
  // If popup is already visible, don't create another one
  if (isSignInPopupVisible) {
    return null;
  }
  
  isSignInPopupVisible = true;
  
  // Get video position
  const videoRect = video.getBoundingClientRect();
  
  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'signin-popup-wrapper';
  wrapper.style.left = `${videoRect.left}px`;
  wrapper.style.top = `${videoRect.top}px`;
  wrapper.style.width = `${videoRect.width}px`;
  wrapper.style.height = `${videoRect.height}px`;
  
  // Prevent clicks from reaching video
  wrapper.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  // Create popup container
  const popupContainer = document.createElement('div');
  popupContainer.className = 'signin-popup';

  // Message
  const message = document.createElement('div');
  message.className = 'signin-popup-message';
  message.textContent = 'Please sign in to use SelectText.Exe';

  // Define closePopup function for reuse
  function closePopup(e) {
    if (e) {
      e.stopPropagation();
    }
    wrapper.remove();
    isSignInPopupVisible = false;
  }

  // Create link with Google Sign-in
  const link = document.createElement('a');
  link.className = 'signin-popup-link';
  link.href = 'http://localhost:5173/login_signup?source=extension&auto_login=true';
  link.target = '_blank';
  
  // Create button content with Google logo and text
  const buttonContent = document.createElement('div');
  buttonContent.style.display = 'flex';
  buttonContent.style.alignItems = 'center';
  buttonContent.style.justifyContent = 'center';
  buttonContent.style.gap = '8px';
  
  // Google logo as image
  const googleLogo = document.createElement('img');
  googleLogo.src = 'https://www.google.com/favicon.ico';
  googleLogo.alt = 'Google';
  googleLogo.style.width = '18px';
  googleLogo.style.height = '18px';
  
  // Text span
  const textSpan = document.createElement('span');
  textSpan.textContent = 'Sign in with Google';
  
  // Add elements to button content
  buttonContent.appendChild(googleLogo);
  buttonContent.appendChild(textSpan);
  
  // Add button content to link
  link.appendChild(buttonContent);

  link.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(link.href, '_blank');
    closePopup();
  });

  // Close button
  const closeButton = document.createElement('button');
  closeButton.className = 'signin-popup-close';
  closeButton.textContent = '×';
  closeButton.onclick = closePopup;

  // Assemble and add to DOM
  popupContainer.appendChild(closeButton);
  popupContainer.appendChild(message);
  popupContainer.appendChild(link);
  wrapper.appendChild(popupContainer);
  document.body.appendChild(wrapper);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (wrapper.parentNode) {
      wrapper.remove();
      isSignInPopupVisible = false;
    }
  }, 10000);

  return wrapper;
}
async function processScreenshot(video) {
  return new Promise(async (resolve) => {
    try {
      // Check authentication first
      const isAuthenticated = await checkAuthStatus();
      
      if (!isAuthenticated) {
        // Show sign-in popup if not authenticated
        showSignInPopup(video);
        resolve(null);
        return;
      }
      
      // Get authentication info
      const authInfo = await new Promise((resolve) => {
        chrome.storage.local.get(['access_token', 'refresh_token'], function(result) {
          console.log('Auth tokens retrieved:', {
            access: result.access_token ? 'present' : 'missing',
            refresh: result.refresh_token ? 'present' : 'missing'
          });
          resolve(result);
        });
      });
      
      if (!authInfo.access_token) {
        console.error('No authentication token found');
        showSignInPopup(video);
        resolve(null);
        return;
      }

      // Get video dimensions and position
      const videoRect = video.getBoundingClientRect();
      const scale = window.devicePixelRatio;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = videoRect.width * scale;
      canvas.height = videoRect.height * scale;
      
      ctx.drawImage(video, 
        0, 0,
        video.videoWidth, video.videoHeight,
        0, 0,
        canvas.width, canvas.height
      );

      const base64Image = canvas.toDataURL('image/jpeg');
      
      // Changed from OAuth to Bearer
      const response = await fetch('http://localhost:8000/api/ocr/process/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authInfo.access_token}`  // Changed from OAuth to Bearer
        },
        body: JSON.stringify({
          image: base64Image
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          try {
            const refreshResponse = await fetch('http://localhost:8000/api/token/refresh/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                refresh: authInfo.refresh_token
              })
            });

            if (refreshResponse.ok) {
              const newTokens = await refreshResponse.json();
              await new Promise((resolve) => {
                chrome.storage.local.set({
                  access_token: newTokens.access
                }, resolve);
              });
              return processScreenshot(video);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            resolve(null);
            return;
          }
        }
        
        const errorData = await response.json();
        console.error('OCR processing error:', errorData);
        
        if (errorData.error === "You have used all your free credits. Please upgrade your plan.") {
          showCreditExhaustedPopup(video);
        }
  
        resolve(null);
        return;
      }
      
      const responseData = await response.json();
      
      if (responseData.error) {
        console.error('OCR processing error:', responseData.error);
        resolve(null);
        return;
      }

      if (responseData.responses && responseData.responses[0] && responseData.responses[0].textAnnotations) {
        // Get all annotations except the first one (which is the full text)
        const annotations = responseData.responses[0].textAnnotations.slice(1);
        
        // Convert annotations to word objects with additional properties
        const words = annotations.map((annotation) => {
          // Calculate positions and dimensions
          const x = annotation.boundingPoly.vertices[0].x / scale;
          const y = annotation.boundingPoly.vertices[0].y / scale;
          const width = (annotation.boundingPoly.vertices[2].x - annotation.boundingPoly.vertices[0].x) / scale;
          const height = (annotation.boundingPoly.vertices[2].y - annotation.boundingPoly.vertices[0].y) / scale;
          
          return {
            text: annotation.description,
            y: y + videoRect.top,
            x: x + videoRect.left,
            height: height,
            width: width,
            right: x + width + videoRect.left,
            bottom: y + height + videoRect.top,
            originalY: y,
            originalX: x,
            originalRight: x + width  // Add right edge position for easier gap calculations
          };
        });
        
        // Sort words by vertical position first, then horizontal
        words.sort((a, b) => {
          // Group words into lines based on vertical position
          const lineThreshold = Math.min(a.height, b.height) * 0.5;
          const yDiff = Math.abs(a.originalY - b.originalY);
          
          if (yDiff < lineThreshold) {
            // Same line, sort left to right
            return a.originalX - b.originalX;
          }
          // Different lines, sort top to bottom
          return a.originalY - b.originalY;
        });
        
        // Process words to add spaces and line breaks
        const processedWords = [];
        let currentLine = -1;
        let lastWord = null;
        let lineWords = [];
        
        // First pass: group words into lines and assign line numbers
        words.forEach((word, index) => {
          const lineThreshold = lastWord ? Math.min(word.height, lastWord.height) * 0.5 : 0;
          const isNewLine = lastWord && Math.abs(word.originalY - lastWord.originalY) >= lineThreshold;
          
          if (isNewLine || index === 0) {
            // Process previous line if it exists
            if (lineWords.length > 0) {
              analyzeLineGaps(lineWords);
            }
            
            // Start new line
            currentLine++;
            lineWords = [word];
          } else {
            // Add to current line
            lineWords.push(word);
          }
          
          word.line = currentLine;
          processedWords.push(word);
          lastWord = word;
        });
        
        // Process the last line
        if (lineWords.length > 0) {
          analyzeLineGaps(lineWords);
        }
        
        // Function to analyze gaps within a line
        function analyzeLineGaps(lineWords) {
          if (lineWords.length <= 1) return;
          
          // Calculate gaps between consecutive words
          const gaps = [];
          for (let i = 1; i < lineWords.length; i++) {
            const gap = lineWords[i].originalX - lineWords[i-1].originalRight;
            gaps.push({
              index: i,
              gap: gap,
              leftWord: lineWords[i-1],
              rightWord: lineWords[i]
            });
          }
          
          if (gaps.length === 0) return;
          
          // Sort gaps by size
          gaps.sort((a, b) => a.gap - b.gap);
          
          // Calculate statistics for gaps
          const median = gaps[Math.floor(gaps.length / 2)].gap;
          
          // Calculate mean of non-outlier gaps (those not significantly larger than median)
          const normalGaps = gaps.filter(g => g.gap <= median * 2);
          const meanNormal = normalGaps.reduce((sum, g) => sum + g.gap, 0) / normalGaps.length;
          
          // Standard deviation of normal gaps
          const stdDev = Math.sqrt(
            normalGaps.reduce((sum, g) => sum + Math.pow(g.gap - meanNormal, 2), 0) / normalGaps.length
          );
          
          // Determine threshold for spaces
          // Use a dynamic threshold based on gap statistics
          const spaceThreshold = meanNormal + stdDev * 1.2;
          
          // Apply space decisions to words
          gaps.forEach(g => {
            // Only add space if gap exceeds our threshold
            if (g.gap > spaceThreshold) {
              lineWords[g.index].addSpaceBefore = true;
            }
          });
        }
        
        resolve(processedWords);
      } else {
        console.error('No text recognized in the image');
        resolve(null);
      }
    } catch (error) {
      console.error('Error processing screenshot:', error);
      resolve(null);
    }
  });
}
function injectCSS() {
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = chrome.runtime.getURL('style.css');
    link.onload = () => resolve();
    link.onerror = (e) => console.error('CSS loading failed:', e);
    document.head.appendChild(link);
  });
}
function createToggleSwitch(video) {
  // Create container
  const container = document.createElement('label');
  container.className = 'container';
  Object.assign(container.style, {
    position: 'absolute',
    top: '35px',
    right: '10px',
    left: 'auto',
    zIndex: '1000000',
    backgroundColor: 'transparent',
    pointerEvents: 'all',
    display: 'none' // Initially hidden
  });

  // Create toggle switch input
  const toggleSwitch = document.createElement('input');
  toggleSwitch.type = 'checkbox';
  toggleSwitch.checked = false;
  Object.assign(toggleSwitch.style, {
    pointerEvents: 'all',
    position: 'relative',
    opacity: '0',
    cursor: 'pointer',
    width: '100%',
    height: '100%',
    zIndex: '1000001'
  });

  // Handle toggle switch changes with authentication
  // Inside createToggleSwitch function, update the toggle switch event listener:

  // Update this section in the createToggleSwitch function
toggleSwitch.addEventListener('change', async (event) => {
  event.stopPropagation();
  
  // Check authentication before processing
  const isAuthenticated = await checkAuthStatus();
  
  if (!isAuthenticated) {
    // Reset checkbox state
    event.target.checked = false;
    
    // Only show sign-in popup if not already visible
    if (!isSignInPopupVisible) {
      showSignInPopup(video);
      
      // Also inform background script to open login
      chrome.runtime.sendMessage({ action: "openLogin" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error opening login:', chrome.runtime.lastError);
        }
      });
    }
    return;
  }
  
  // Continue with existing logic if authenticated
  if (!hasProcessedOCR && event.target.checked) {
    const words = await processScreenshot(video);
    if (!words) {
      // If words is null, it might be due to credit exhaustion
      // The popup would have been shown by processScreenshot
      event.target.checked = false;
      return;
    }
    createWordOverlays(words);
    hasProcessedOCR = true;
    initializeTextSelection();
    toggleProtectiveOverlay(video, true);
  }else if (event.target.checked && hasProcessedOCR) {
    // If just toggling visibility ON
    toggleProtectiveOverlay(video, true);
  } else {
    // If toggling OFF
    toggleProtectiveOverlay(video, false);
  }

  // Toggle visibility
  textVisible = event.target.checked;
  const wordOverlays = document.querySelectorAll('.word-overlay');
  wordOverlays.forEach(overlay => {
    overlay.style.display = textVisible ? 'flex' : 'none';
  });
});

  // Create checkmark element
  const checkmark = document.createElement('div');
  checkmark.className = 'checkmark';
  checkmark.style.pointerEvents = 'none';

  // Reset OCR state and cleanup
  const resetOCRState = () => {
    hasProcessedOCR = false;
    textVisible = false;
    toggleSwitch.checked = false;
    const wordOverlays = document.querySelectorAll('.word-overlay');
    wordOverlays.forEach(overlay => overlay.remove());
      toggleProtectiveOverlay(video, false);

  };

  // Video state event listeners
  video.addEventListener('pause', () => {
    container.style.display = 'block'; // Show when paused
  });

  video.addEventListener('play', () => {
    container.style.display = 'none'; // Hide when playing
    resetOCRState();
  });

  // Add seeking and timeupdate listeners
  video.addEventListener('seeking', () => {
    resetOCRState();
  });

  video.addEventListener('seeked', () => {
    if (video.paused) {
      container.style.display = 'block';
    }
  });

  // Prevent unwanted events
  const preventEvent = (event) => {
    event.stopPropagation();
    event.preventDefault();
  };

  container.addEventListener('mousedown', preventEvent);
  container.addEventListener('dblclick', preventEvent);
  toggleSwitch.addEventListener('mousedown', preventEvent);
  toggleSwitch.addEventListener('dblclick', preventEvent);

  // Initial state check
  if (video.paused) {
    container.style.display = 'block';
  }

  // Build and return container
  container.appendChild(toggleSwitch);
  container.appendChild(checkmark);
  return container;
}

// Helper function to create word overlays
// Helper function to create word overlays with fully stretched text
function createWordOverlays(words) {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  words.forEach(box => {
    // Create the container div
    const wordDiv = document.createElement('div');
    wordDiv.className = 'word-overlay';
    wordDiv.setAttribute('data-text', box.text);
    if (box.line !== undefined) {
      wordDiv.setAttribute('data-line', box.line);
    }
    
    // Store spacing information
    if (box.addSpaceBefore === true) {
      wordDiv.setAttribute('data-add-space', 'true');
    }
    
    // Position and size the container
    Object.assign(wordDiv.style, {
      position: 'absolute',
      top: (box.y + scrollY) + 'px',
      left: (box.x + scrollX) + 'px',
      width: box.width + 'px',
      height: box.height + 'px',
      backgroundColor: 'rgb(0, 0, 0)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      padding: '0',
      margin: '0',
      zIndex: 999999,
      cursor: 'text',
      border: '1px solid #a64dff'
    });
    
    // Create the text span that will be stretched
    const textSpan = document.createElement('span');
    textSpan.textContent = box.text;
    textSpan.className = 'overlay-text';
    
    // Initial style for the text
    Object.assign(textSpan.style, {
      display: 'block',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      // textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      fontSize: '10px', // Start small
      position: 'absolute',
      transformOrigin: 'center'
    });
    
    
    // Add the text span to the container
    wordDiv.appendChild(textSpan);
    document.body.appendChild(wordDiv);
    
    // Now stretch the text to fill the container
    stretchTextToFit(textSpan, box.width, box.height);
  });
}

// Helper function to stretch text to fit container
function stretchTextToFit(textElement, containerWidth, containerHeight) {
  let fontSize = 10; // Start with a small font size
  textElement.style.fontSize = fontSize + 'px';
  
  // Increase font size until it overflows
  while (textElement.scrollWidth <= containerWidth && textElement.scrollHeight <= containerHeight && fontSize < 1000) {
    fontSize++;
    textElement.style.fontSize = fontSize + 'px';
  }
  
  // Reduce by one to prevent overflow
  fontSize--;
  textElement.style.fontSize = fontSize + 'px';
  
  // Calculate scale factors to stretch text to fill container
  const scaleX = containerWidth / textElement.scrollWidth;
  const scaleY = containerHeight / textElement.scrollHeight;
  
  // Apply the stretch transformation
  textElement.style.transform = `scale(${scaleX}, ${scaleY})`;
}
// Initialize toggle switches for existing videos
async function initializeVideoControls() {
  await injectCSS();
  const videos = document.querySelectorAll('video');
  videos.forEach(video => {
    const container = createToggleSwitch(video);
    video.parentElement.appendChild(container);

    container.querySelector('input').addEventListener('click', (event) => {
      event.stopPropagation();
    });

    container.querySelector('input').addEventListener('change', (event) => {
      textVisible = event.target.checked;
      const wordOverlays = document.querySelectorAll('.word-overlay');
      wordOverlays.forEach(overlay => {
        overlay.style.display = textVisible ? 'flex' : 'none';
      });
    });
  });
}

// Run initialization when the page loads
document.addEventListener('DOMContentLoaded', initializeVideoControls);

// Watch for dynamically added videos
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      const hasNewVideo = Array.from(mutation.addedNodes).some(node => 
        node.nodeName === 'VIDEO' || (node instanceof Element && node.querySelector('video'))
      );
      if (hasNewVideo) {
        initializeVideoControls();
      }
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Handle messages from popup
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log('Message received in content.js:', request);
  
  if (request.action === 'overlayWords') {
    await injectCSS();
  
    const scale = window.devicePixelRatio;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
  
    request.boxes.forEach(box => {
      // Create container div
      const wordDiv = document.createElement('div');
      wordDiv.className = 'word-overlay';
      wordDiv.setAttribute('data-text', box.text);
      
      const boxWidth = box.width / scale;
      const boxHeight = box.height / scale;
      
      // Position and size the container
      Object.assign(wordDiv.style, {
        position: 'absolute',
        top: (box.y / scale + scrollY) + 'px',
        left: (box.x / scale + scrollX) + 'px',
        width: boxWidth + 'px',
        height: boxHeight + 'px',
        backgroundColor: 'rgb(0, 0, 0)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        padding: '0',
        margin: '0',
        zIndex: 999999,
        cursor: 'text'
      });
      
      // Create the text span that will be stretched
      const textSpan = document.createElement('span');
      textSpan.textContent = box.text;
      textSpan.className = 'overlay-text';
      
      // Initial style for the text
      Object.assign(textSpan.style, {
        display: 'block',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        fontSize: '10px', // Start small
        position: 'absolute',
        transformOrigin: 'center'
      });
      
      // Add the text span to the container
      wordDiv.appendChild(textSpan);
      document.body.appendChild(wordDiv);
      
      // Now stretch the text to fit the container
      stretchTextToFit(textSpan, boxWidth, boxHeight);
    });
  

    // Reinitialize video controls after adding overlays
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      if (!video.parentElement.querySelector('.container')) {
        const container = createToggleSwitch(video);
        video.parentElement.appendChild(container);

        container.querySelector('input').addEventListener('click', (event) => {
          event.stopPropagation();
        });

        container.querySelector('input').addEventListener('change', (event) => {
          textVisible = event.target.checked;
          const wordOverlays = document.querySelectorAll('.word-overlay');
          wordOverlays.forEach(overlay => {
            overlay.style.display = textVisible ? 'flex' : 'none';
          });
        });
      }
    });
  } else if (request.action === 'toggleText') {
    textVisible = !textVisible;
    const wordOverlays = document.querySelectorAll('.word-overlay');
    wordOverlays.forEach(overlay => {
      overlay.style.display = textVisible ? 'flex' : 'none';
    });
  }
});