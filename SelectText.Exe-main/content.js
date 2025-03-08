let textVisible = true;
let hasProcessedOCR = false;
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let selectionOverlay = null;
let isSignInPopupVisible = false;
let currentDisplayStyle = 'opaque';
const SELECTED_BACKGROUND = '#4287f5';
const OPAQUE_BACKGROUND = 'rgb(0, 0, 0)';
const TRANSPARENT_BACKGROUND = 'transparent';
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
  // Create selection styles
  const selectionStyles = `
    .selection-overlay {
      position: fixed;
      background: rgba(66, 135, 245, 0.2);
      border: 1px solid #4287f5;
      pointer-events: auto;
      z-index: 999998;
    }
  `;
  
  const style = document.createElement('style');
  style.textContent = selectionStyles;
  document.head.appendChild(style);

  // Selection tracking variables
  let isSelecting = false;
  let selectionStart = null;
  let selectionOverlay = null;

  // Mouse down event
  document.addEventListener('mousedown', (e) => {
    if (e.button === 0 && textVisible && hasProcessedOCR) {
      e.preventDefault();
      e.stopPropagation();
      isSelecting = true;
      selectionStart = { x: e.clientX, y: e.clientY };
      
      // Create selection overlay
      selectionOverlay = document.createElement('div');
      selectionOverlay.className = 'selection-overlay';
      selectionOverlay.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      document.body.appendChild(selectionOverlay);
    }
  });

  // Mouse move event
  document.addEventListener('mousemove', (e) => {
    if (isSelecting && selectionOverlay) {
      e.preventDefault();
      e.stopPropagation();
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

      processSelectionHighlight(selectionBounds);
    }
  });

  // Mouse up event
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
    
      // Collect and process selected words
      const selectedWords = collectSelectedWords(selectionBounds);
  
      if (selectedWords.length > 0) {
        processSelectedWords(selectedWords, selectionBounds);
      }

      selectionOverlay.remove();
      selectionOverlay = null;
    }
  });

  // Prevent interactions with word overlays
  document.addEventListener('click', (e) => {
    if (textVisible && hasProcessedOCR) {
      const wordOverlay = e.target.closest('.word-overlay');
      if (wordOverlay) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, true);
}

function collectSelectedWords(selectionBounds) {
  const selectedWords = [];
  const wordOverlays = document.querySelectorAll('.word-overlay');
  
  wordOverlays.forEach(overlay => {
    const rect = overlay.getBoundingClientRect();
    const textSpan = overlay.querySelector('.overlay-text');
    const displayStyle = overlay.getAttribute('data-display-style') || 'opaque';
    
    if (rect.left < selectionBounds.right &&
        rect.right > selectionBounds.left &&
        rect.top < selectionBounds.bottom &&
        rect.bottom > selectionBounds.top) {
        
      selectedWords.push({
        text: overlay.getAttribute('data-text'),
        line: parseInt(overlay.getAttribute('data-line') || '0'),
        addSpaceBefore: overlay.hasAttribute('data-add-space'),
        y: rect.top,
        x: rect.left,
        width: rect.width
      });
      
      overlay.style.backgroundColor = '#4287f5';
      const textSpan = overlay.querySelector('.overlay-text');
      if (textSpan) {
        textSpan.style.color = 'black';
        textSpan.style.display = 'block'; // Always show text when selected

      }
    } else {
      overlay.style.backgroundColor = displayStyle === 'seethrough' ? 
        TRANSPARENT_BACKGROUND : OPAQUE_BACKGROUND;
        if (textSpan) {
          textSpan.style.color = 'white';
          textSpan.style.display = displayStyle === 'seethrough' ? 'none' : 'block';
        }
    }
  });

  return selectedWords;
}

function processSelectedWords(selectedWords, selectionBounds) {
  chrome.storage.local.get(['copyStyle'], function(result) {
    const copyStyle = result.copyStyle || 'multiline';
    
    selectedWords.sort((a, b) => {
      if (a.line !== b.line) return a.line - b.line;
      return a.x - b.x;
    });
    
    let textToCopy = '';
    
  
    switch(copyStyle) {
      case 'singleline':
        textToCopy = selectedWords
          .map(word => word.text)
          .join(' ');
        break;
        
        case 'indent':
          // Calculate minimum x position as a reference point
          const baseX = Math.min(...selectedWords.map(w => w.x));
          let currentLine = -1;
          let charWidthEstimates = [];
          
          // First pass - calculate average character width
          selectedWords.forEach(word => {
            if (word.text && word.text.length > 1 && word.width) {
              const charWidth = word.width / word.text.length;
              charWidthEstimates.push(charWidth);
            }
          });
          
          // Calculate average character width from samples
          const avgCharWidth = charWidthEstimates.length > 0 ? 
            charWidthEstimates.reduce((sum, width) => sum + width, 0) / charWidthEstimates.length : 
            8; // Default if no estimates
          
          // Space character width (typically wider than average char)
          const spaceWidth = avgCharWidth * 1.2;
          
          // Process words with intelligent indentation
          selectedWords.forEach(word => {
            if (word.line !== currentLine) {
              // Handle new line
              if (currentLine !== -1) textToCopy += '\n';
              
              // Calculate indent based on position and character width
              const indentPixels = word.x - baseX;
              const indentSpaces = Math.round(indentPixels / spaceWidth);
              
              // Apply indent (with a maximum to prevent excessive spaces)
              textToCopy += ' '.repeat(Math.min(indentSpaces, 100));
              currentLine = word.line;
              lastWordEndX = word.x + word.width;
            } else {
              // Calculate gap between words on same line
              const gap = word.x - lastWordEndX;
              
              // Convert gap to number of spaces based on character width
              const spaceCount = Math.round(gap / spaceWidth);
              
              // Add spaces if needed (and not already at start of line)
              if (spaceCount > 0) {
                textToCopy += ' '.repeat(spaceCount);
              }
              
              lastWordEndX = word.x + word.width;
            }
            
            // Add the word text
            textToCopy += word.text;
          });
          break;
        
          case 'multiline':
            default:
              let currentMultiLine = -1;
              let multilineCharWidthEstimates = []; // Renamed from charWidthEstimates
              
              // First pass - calculate average character width
              selectedWords.forEach(word => {
                if (word.text && word.text.length > 1 && word.width) {
                  const charWidth = word.width / word.text.length;
                  multilineCharWidthEstimates.push(charWidth);
                }
              });
              
              // Calculate average character width from samples
              const multilineAvgCharWidth = multilineCharWidthEstimates.length > 0 ? 
                multilineCharWidthEstimates.reduce((sum, width) => sum + width, 0) / multilineCharWidthEstimates.length : 
                8; // Default if no estimates
              
              // Process words with character-width spacing
              let multilineLastWordEndX = -1; // Renamed from lastWordEndX
              
              selectedWords.forEach(word => {
                if (word.line !== currentMultiLine) {
                  // Handle new line
                  if (currentMultiLine !== -1) textToCopy += '\n';
                  currentMultiLine = word.line;
                  multilineLastWordEndX = -1;
                } else if (multilineLastWordEndX !== -1) {
                  // Calculate gap between current word and last word
                  const gap = word.x - multilineLastWordEndX;
                  
                  // Convert gap to number of spaces (your algorithm)
                  const spaceCount = Math.round(gap / multilineAvgCharWidth);
                  
                  // Only add spaces if there's a meaningful gap
                  if (spaceCount > 0) {
                    textToCopy += ' '.repeat(spaceCount);
                  }
                }
                
                // Add the word text
                textToCopy += word.text;
                multilineLastWordEndX = word.x + word.width; // Track end position for next word
              });
              break;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      // Reset all word overlay colors
      const allWordOverlays = document.querySelectorAll('.word-overlay');
      allWordOverlays.forEach(overlay => {
        const displayStyle = overlay.getAttribute('data-display-style') || 'opaque';
        const textSpan = overlay.querySelector('.overlay-text');
        
        overlay.style.backgroundColor = displayStyle === 'seethrough' ? 
          TRANSPARENT_BACKGROUND : OPAQUE_BACKGROUND;
        
        if (textSpan) {
          textSpan.style.color = 'white';
          textSpan.style.display = displayStyle === 'seethrough' ? 'none' : 'block';
        }
      });

      // Create copy feedback
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
        transition: 'all 0.7s'
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
  });
}
function processSelectionHighlight(selectionBounds) {
  const wordOverlays = document.querySelectorAll('.word-overlay');
  wordOverlays.forEach(overlay => {
    const rect = overlay.getBoundingClientRect();
    const textSpan = overlay.querySelector('.overlay-text');
    const displayStyle = overlay.getAttribute('data-display-style');
    
    if (rect.left < selectionBounds.right &&
        rect.right > selectionBounds.left &&
        rect.top < selectionBounds.bottom &&
        rect.bottom > selectionBounds.top) {
      overlay.style.backgroundColor = SELECTED_BACKGROUND;
      if (textSpan) {
        textSpan.style.color = 'black';
        textSpan.style.display = 'block';
      }
    } else {
      overlay.style.backgroundColor = displayStyle === 'seethrough' ? TRANSPARENT_BACKGROUND : OPAQUE_BACKGROUND;
      if (textSpan) {
        textSpan.style.color = 'white';
        textSpan.style.display = displayStyle === 'seethrough' ? 'none' : 'block';
      }
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

      if (responseData.responses?.[0]?.textAnnotations) {
        // Extract word annotations (skip first one which is the full text)
        const annotations = responseData.responses[0].textAnnotations.slice(1);
        
        // Convert annotations to word objects with positioning data
        const words = annotations.map(annotation => {
          const x = annotation.boundingPoly.vertices[0].x / scale;
          const y = annotation.boundingPoly.vertices[0].y / scale;
          const width = (annotation.boundingPoly.vertices[2].x - annotation.boundingPoly.vertices[0].x) / scale;
          const height = (annotation.boundingPoly.vertices[2].y - annotation.boundingPoly.vertices[0].y) / scale;
          
          return {
            text: annotation.description,
            y: y + videoRect.top,
            x: x + videoRect.left,
            height, width,
            right: x + width + videoRect.left,
            bottom: y + height + videoRect.top,
            originalY: y,
            originalX: x,
            originalRight: x + width
          };
        });
        
        // Group words into lines and sort by position
        const lineThreshold = word => word.height * 0.5;
        let currentLine = 0;
        let lastWord = null;
        let lineGroups = [];
        
        // Sort by vertical position first
        words.sort((a, b) => {
          const yDiff = Math.abs(a.originalY - b.originalY);
          return yDiff < lineThreshold(a) ? a.originalX - b.originalX : a.originalY - b.originalY;
        });
        
        // Group into lines and process each line
        const processedWords = words.map((word, i) => {
          const isFirstWord = i === 0;
          const isNewLine = !isFirstWord && lastWord && 
                           Math.abs(word.originalY - lastWord.originalY) >= lineThreshold(word);
          
          if (isFirstWord || isNewLine) {
            // Process previous line gaps
            if (lineGroups.length > 1) {
              detectSpaces(lineGroups);
            }
            lineGroups = [word];
            currentLine++;
          } else {
            lineGroups.push(word);
          }
          
          word.line = currentLine;
          lastWord = word;
          return word;
        });
        
        // Process final line
        if (lineGroups.length > 1) {
          detectSpaces(lineGroups);
        }
        
        // Detect spaces between words in a line
        function detectSpaces(lineWords) {
          // Calculate gaps between words
          const gaps = lineWords.slice(1).map((word, i) => ({
            index: i + 1,
            gap: word.originalX - lineWords[i].originalRight
          }));
          
          if (gaps.length === 0) return;
          
          // Calculate statistics for word gaps
          gaps.sort((a, b) => a.gap - b.gap);
          const median = gaps[Math.floor(gaps.length / 2)].gap;
          const normalGaps = gaps.filter(g => g.gap <= median * 2);
          const mean = normalGaps.reduce((sum, g) => sum + g.gap, 0) / normalGaps.length || 0;
          
          // Set space threshold and mark words
          const threshold = mean * 1.5;
          gaps.forEach(g => {
            if (g.gap > threshold) {
              lineWords[g.index].addSpaceBefore = true;
            }
          });
        }
        
        resolve(processedWords);
      } else {
        console.error('No text recognized in image');
        resolve(null);
      }
    } catch (error) {
      console.error('Error processing screenshot:', error);
      resolve(null);
    }
  });
}
function injectCSS() {
  const styles = `
    .loading-overlay {
      position: absolute;
      top: 30rem;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000000;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 6px solid transparent;
      border-top-color:rgb(255, 255, 255);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);

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
  container.className = 'toggle-container';
  Object.assign(container.style, {
    position: 'absolute',
    top: '35px',
    right: '30px',
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
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    
    loadingOverlay.appendChild(spinner);
    video.parentElement.appendChild(loadingOverlay);
    
    try {
      const words = await processScreenshot(video);
      
      // Remove loading overlay
      loadingOverlay.remove();
      
      if (!words) {
        event.target.checked = false;
        return;
      }
      
      createWordOverlays(words, video);
      hasProcessedOCR = true;
      initializeTextSelection();
    } catch (error) {
      console.error('Error processing OCR:', error);
      loadingOverlay.remove();
      event.target.checked = false;
    }
  } 

  // Toggle visibility based on the overlay container for this specific video
  textVisible = event.target.checked;
  if (video.dataset.overlayContainerId) {
    const containerSelector = `#${video.dataset.overlayContainerId} .word-overlay`;
    const wordOverlays = document.querySelectorAll(containerSelector);
    wordOverlays.forEach(overlay => {
      overlay.style.display = textVisible ? 'flex' : 'none';
    });
  }
});

  // Create checkmark element
  const checkmark = document.createElement('div');
  checkmark.className = 'toggle-checkmark';
  checkmark.style.pointerEvents = 'none';

  // Reset OCR state and cleanup
  const resetOCRState = () => {
    hasProcessedOCR = false;
    textVisible = false;
    toggleSwitch.checked = false;
    const wordOverlays = document.querySelectorAll('.word-overlay');
    wordOverlays.forEach(overlay => overlay.remove());

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
// Helper function to create word overlays with fully stretched text
function createWordOverlays(words, video) {
  chrome.storage.local.get(['displayStyle'], function(result) {
    currentDisplayStyle = result.displayStyle || 'opaque';
    createOverlaysWithStyle(words, video, currentDisplayStyle);
  });
}

function createOverlaysWithStyle(words, video, displayStyle) {
  const overlayContainerID = `overlay-container-${Date.now()}`;
  const existingContainer = document.getElementById(overlayContainerID);
  
  let overlayContainer = existingContainer || document.createElement('div');
  if (!existingContainer) {
    overlayContainer.id = overlayContainerID;
    overlayContainer.className = 'word-overlays-container';
    
    Object.assign(overlayContainer.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '999990',
      pointerEvents: 'none'
    });
    
    video.parentElement.appendChild(overlayContainer);
    video.dataset.overlayContainerId = overlayContainerID;
  }

  const backgroundColor = displayStyle === 'seethrough' ? TRANSPARENT_BACKGROUND : OPAQUE_BACKGROUND;
  const textDisplay = displayStyle === 'seethrough' ? 'none' : 'block';

  words.forEach(box => {
    const wordDiv = document.createElement('div');
    wordDiv.className = 'word-overlay';
    wordDiv.setAttribute('data-text', box.text);
    wordDiv.setAttribute('data-display-style', displayStyle);
    
    if (box.line !== undefined) {
      wordDiv.setAttribute('data-line', box.line);
    }
    
    if (box.addSpaceBefore === true) {
      wordDiv.setAttribute('data-add-space', 'true');
    }
    
    const videoRect = video.getBoundingClientRect();
    const relativeTop = box.y - videoRect.top;
    const relativeLeft = box.x - videoRect.left;
    
    Object.assign(wordDiv.style, {
      position: 'absolute',
      top: relativeTop + 'px',
      left: relativeLeft + 'px',
      width: box.width + 'px',
      height: box.height + 'px',
      backgroundColor: backgroundColor,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      padding: '0',
      margin: '0',
      zIndex: '999995',
      cursor: 'text',
      border: '1px solid #a64dff',
      pointerEvents: 'auto',
      transition: 'background-color 0.2s ease'
    });
    
    const textSpan = document.createElement('span');
    textSpan.textContent = box.text;
    textSpan.className = 'overlay-text';
    
    Object.assign(textSpan.style, {
      display: textDisplay,
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      fontSize: '10px',
      position: 'absolute',
      transformOrigin: 'center',
      transition: 'color 0.2s ease'
    });
    
    wordDiv.appendChild(textSpan);
    overlayContainer.appendChild(wordDiv);
    
    
      stretchTextToFit(textSpan, box.width, box.height);
    
  });
  
  return overlayContainer;
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
  if (request.action === "updateDisplayStyle") {
    currentDisplayStyle = request.style;
    const wordOverlays = document.querySelectorAll('.word-overlay');
    
    wordOverlays.forEach(overlay => {
      const textSpan = overlay.querySelector('.overlay-text');
      overlay.setAttribute('data-display-style', request.style);
      
      if (!overlay.style.backgroundColor.includes('rgb(66, 135, 245)')) { // Not selected
        overlay.style.backgroundColor = request.style === 'seethrough' ? TRANSPARENT_BACKGROUND : OPAQUE_BACKGROUND;
        if (textSpan) {
          textSpan.style.display = request.style === 'seethrough' ? 'none' : 'block';
        }
      }
    });
  }
});