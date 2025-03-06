/// video element to be used for text selection
function initializeTextSelection(video) {
    // Create selection styles
    const selectionStyles = `
      .selection-overlay {
        position: absolute;
        background: rgba(66, 135, 245, 0.2);
        border: 1px solid #4287f5;
        pointer-events: auto;
        z-index: 999998;
      }
    `;
    
    // Create style element properly
    const style = document.createElement('style');
    style.textContent = selectionStyles;
    document.head.appendChild(style);
  
    // Get video's parent container
    const videoContainer = video.parentElement;
    
    // Use the global variables
    isSelecting = false;
    selectionStart = { x: 0, y: 0 };
    selectionOverlay = null;
  
    // Mouse down event on the video container
    videoContainer.addEventListener('mousedown', (e) => {
      if (e.button === 0 && textVisible && hasProcessedOCR) {
        e.preventDefault();
        e.stopPropagation();
        
        
        isSelecting = true;
        
        // Calculate position relative to video container
        const containerRect = videoContainer.getBoundingClientRect();
        selectionStart = { 
          x: e.clientX - containerRect.left, 
          y: e.clientY - containerRect.top 
        };
        
        // Create selection overlay within the video container
        selectionOverlay = document.createElement('div');
        selectionOverlay.className = 'selection-overlay';
        selectionOverlay.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          // e.stopImmediatePropagation(); // Add this to prevent other handlers
  
        });
        
        // Append to video container instead of document.body
        videoContainer.appendChild(selectionOverlay);
      }
    });
  
    // Mouse move event on the video container
    videoContainer.addEventListener('mousemove', (e) => {
      if (isSelecting && selectionOverlay) {
        e.preventDefault();
        e.stopPropagation();
        
        // Calculate position relative to video container
        const containerRect = videoContainer.getBoundingClientRect();
        const currentPos = { 
          x: e.clientX - containerRect.left, 
          y: e.clientY - containerRect.top 
        };
        
        // Calculate selection rectangle within container coordinates
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
        
        // For highlight processing, need to convert back to page coordinates
        const selectionBounds = {
          left: left + containerRect.left,
          top: top + containerRect.top,
          right: left + width + containerRect.left,
          bottom: top + height + containerRect.top
        };
  
        processSelectionHighlight(selectionBounds);
      }
    });
  
    // Mouse up event on the video container
    videoContainer.addEventListener('mouseup', (e) => {
      if (isSelecting && selectionOverlay) {
        e.preventDefault();
        e.stopPropagation();
        
        isSelecting = false;
        
        // Get container's position
        const containerRect = videoContainer.getBoundingClientRect();
        
        // Convert container-relative positions to page coordinates
        const selectionBounds = {
          left: parseInt(selectionOverlay.style.left) + containerRect.left,
          top: parseInt(selectionOverlay.style.top) + containerRect.top,
          right: (parseInt(selectionOverlay.style.left) + parseInt(selectionOverlay.style.width)) + containerRect.left,
          bottom: (parseInt(selectionOverlay.style.top) + parseInt(selectionOverlay.style.height)) + containerRect.top
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
  
    // Add mouse out handler to handle if mouse leaves the container while selecting
    // videoContainer.addEventListener('mouseleave', (e) => {
    //   if (isSelecting && selectionOverlay) {
    //     // Don't end the selection, just update to the edge of the container
    //     const containerRect = videoContainer.getBoundingClientRect();
    //     const currentPos = { 
    //       x: Math.min(Math.max(e.clientX - containerRect.left, 0), containerRect.width),
    //       y: Math.min(Math.max(e.clientY - containerRect.top, 0), containerRect.height)
    //     };
        
    //     // Update selection rectangle
    //     const left = Math.min(selectionStart.x, currentPos.x);
    //     const top = Math.min(selectionStart.y, currentPos.y);
    //     const width = Math.abs(currentPos.x - selectionStart.x);
    //     const height = Math.abs(currentPos.y - selectionStart.y);
        
    //     // Update selection overlay
    //     Object.assign(selectionOverlay.style, {
    //       left: left + 'px',
    //       top: top + 'px',
    //       width: width + 'px',
    //       height: height + 'px'
    //     });
    //   }
    // });
  
    // // Handle mouse enter after leaving while selecting
    // videoContainer.addEventListener('mouseenter', (e) => {
    //   if (isSelecting && selectionOverlay) {
    //     const containerRect = videoContainer.getBoundingClientRect();
    //     const currentPos = { 
    //       x: e.clientX - containerRect.left, 
    //       y: e.clientY - containerRect.top 
    //     };
        
    //     // Update selection rectangle
    //     const left = Math.min(selectionStart.x, currentPos.x);
    //     const top = Math.min(selectionStart.y, currentPos.y);
    //     const width = Math.abs(currentPos.x - selectionStart.x);
    //     const height = Math.abs(currentPos.y - selectionStart.y);
        
    //     // Update selection overlay
    //     Object.assign(selectionOverlay.style, {
    //       left: left + 'px',
    //       top: top + 'px',
    //       width: width + 'px',
    //       height: height + 'px'
    //     });
    //   }
    // });
  
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