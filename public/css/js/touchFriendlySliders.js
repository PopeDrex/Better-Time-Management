document.addEventListener('DOMContentLoaded', function() {
  // Progress slider elements
  const audioPlayer = document.getElementById('audio-player');
  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  const progressHandle = document.getElementById('progress-handle');
  
  // Volume slider elements
  const volumeContainer = document.getElementById('volume-container');
  const volumeBar = document.getElementById('volume-bar');
  const volumeHandle = document.getElementById('volume-handle');
  const volumeBtn = document.getElementById('volume-btn');
  
  // Initialize handle positions
  function updateProgressHandlePosition() {
    if (!audioPlayer || !progressHandle) return;
    const percent = audioPlayer.duration ? (audioPlayer.currentTime / audioPlayer.duration) * 100 : 0;
    progressContainer.style.setProperty('--progress-percent', `${percent}%`);
    progressHandle.style.left = `calc(${percent}% - 8px)`;
  }
  
  function updateVolumeHandlePosition() {
    if (!audioPlayer || !volumeHandle) return;
    const percent = audioPlayer.muted ? 0 : audioPlayer.volume * 100;
    volumeContainer.style.setProperty('--volume-percent', `${percent}%`);
    volumeHandle.style.left = `calc(${percent}% - 8px)`;
    volumeBar.style.width = `${percent}%`;
    
    // Update volume icon
    const volumeIcon = volumeBtn.querySelector('i');
    if (percent === 0) {
      volumeIcon.className = 'fas fa-volume-mute';
    } else if (percent < 50) {
      volumeIcon.className = 'fas fa-volume-down';
    } else {
      volumeIcon.className = 'fas fa-volume-up';
    }
  }
  
  // Make sliders draggable
  function setupDraggableSlider(container, handle, onUpdate) {
    if (!container || !handle) return;
    
    let isDragging = false;
    
    const startDrag = function(e) {
      e.preventDefault(); // Prevent default to avoid text selection
      isDragging = true;
      container.classList.add('dragging');
      
      // Add a data attribute to mark that we're dragging
      container.setAttribute('data-dragging', 'true');
      
      updatePosition(e);
      document.addEventListener('mousemove', updatePosition);
      document.addEventListener('touchmove', updatePosition, { passive: false });
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchend', stopDrag);
    };
    
    const updatePosition = function(e) {
      if (!isDragging) return;
      
      e.preventDefault();
      
      // Get coordinates (handle both mouse and touch)
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const rect = container.getBoundingClientRect();
      let percent = (clientX - rect.left) / rect.width;
      
      // Clamp percent between 0 and 1
      percent = Math.max(0, Math.min(1, percent));
      
      onUpdate(percent);
    };
    
    const stopDrag = function() {
      isDragging = false;
      container.classList.remove('dragging');
      
      // Remove the dragging attribute after a short delay
      // This prevents the click handler from firing immediately after drag
      setTimeout(() => {
        container.removeAttribute('data-dragging');
      }, 50);
      
      document.removeEventListener('mousemove', updatePosition);
      document.removeEventListener('touchmove', updatePosition);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
    };
    
    // Add event listeners
    handle.addEventListener('mousedown', startDrag);
    handle.addEventListener('touchstart', startDrag, { passive: false });
    
    // Modify the container click behavior to check if we're dragging
    container.addEventListener('click', function(e) {
      if (container.getAttribute('data-dragging') === 'true') {
        // Skip the click if we were just dragging
        return;
      }
      
      // Otherwise handle the click normally
      const rect = container.getBoundingClientRect();
      let percent = (e.clientX - rect.left) / rect.width;
      percent = Math.max(0, Math.min(1, percent));
      onUpdate(percent);
    });
  }
  
  // Setup progress slider
  setupDraggableSlider(progressContainer, progressHandle, function(percent) {
    if (!audioPlayer || !audioPlayer.duration) return;
    audioPlayer.currentTime = percent * audioPlayer.duration;
    progressBar.style.width = `${percent * 100}%`;
  });
  
  // Setup volume slider
  setupDraggableSlider(volumeContainer, volumeHandle, function(percent) {
    if (!audioPlayer) return;
    audioPlayer.volume = percent;
    audioPlayer.muted = (percent === 0);
    updateVolumeHandlePosition();
  });
  
  // Initialize handle positions
  if (audioPlayer) {
    audioPlayer.addEventListener('timeupdate', updateProgressHandlePosition);
    audioPlayer.addEventListener('loadedmetadata', updateProgressHandlePosition);
    audioPlayer.addEventListener('volumechange', updateVolumeHandlePosition);
    
    // Set initial volume from localStorage if available
    const savedVolume = localStorage.getItem('playerVolume');
    if (savedVolume !== null) {
      audioPlayer.volume = parseFloat(savedVolume);
    }
    
    updateVolumeHandlePosition();
  }
  
  // Toggle mute on volume icon click
  if (volumeBtn) {
    volumeBtn.addEventListener('click', function() {
      if (audioPlayer) {
        audioPlayer.muted = !audioPlayer.muted;
        if (!audioPlayer.muted && audioPlayer.volume === 0) {
          audioPlayer.volume = 0.5;
        }
        updateVolumeHandlePosition();
        
        // Save volume to localStorage
        localStorage.setItem('playerVolume', audioPlayer.muted ? 0 : audioPlayer.volume);
      }
    });
  }
});