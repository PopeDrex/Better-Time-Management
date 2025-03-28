document.addEventListener('DOMContentLoaded', function() {
    const albumTitles = document.querySelectorAll('.album-title');
    
    function adjustFontSize(element) {
      const container = element.parentElement;
      const containerWidth = container.offsetWidth;
      
      // Reset font size for accurate measurement
      element.style.fontSize = '1rem';
      
      // If text is overflowing
      if (element.scrollWidth > containerWidth) {
        // Gradually reduce font size until it fits
        let fontSize = 1.0;
        while (element.scrollWidth > containerWidth && fontSize > 0.7) {
          fontSize -= 0.05;
          element.style.fontSize = fontSize + 'rem';
        }
      }
    }
    
    // Apply to all album titles
    albumTitles.forEach(adjustFontSize);
    
    // Re-adjust on window resize
    window.addEventListener('resize', function() {
      albumTitles.forEach(adjustFontSize);
    });
  });