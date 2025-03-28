let lastScrollPosition = 0;
const navbar = document.querySelector('.navbar');
const scrollThreshold = 50; // Minimum scroll amount before triggering

window.addEventListener('scroll', function() {
    // Get current scroll position
    const currentScrollPosition = window.scrollY;
    
    // Determine scroll direction and apply appropriate classes
    if (currentScrollPosition > scrollThreshold) {
        // When scrolled down beyond threshold, add background
        navbar.style.background = 'rgba(0, 0, 0, 0.9)';
        navbar.style.padding = '10px 0';
        
        // Hide navbar when scrolling down, show when scrolling up
        if (currentScrollPosition > lastScrollPosition) {
            // Scrolling DOWN - hide navbar
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling UP - show navbar
            navbar.style.transform = 'translateY(0)';
        }
    } else {
        // At top of page - transparent background and always visible
        navbar.style.background = 'transparent';
        navbar.style.padding = '1rem 0';
        navbar.style.transform = 'translateY(0)';
    }
    
    // Update last scroll position
    lastScrollPosition = currentScrollPosition;
});