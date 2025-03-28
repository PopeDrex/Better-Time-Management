/**
 * Dynamic Page Size - Automatically adjusts page elements to fit different screen sizes
 * while preserving image styles and border radius
 */
document.addEventListener('DOMContentLoaded', function() {
    const responsiveLayout = {
        init: function() {
            this.adjustContentHeight();
            this.adjustFontSizes();
            this.setupScrollBehavior();
            this.setupResizeListener();
            this.adjustNavigation();
            this.preserveImageStyles();
        },
        
        adjustContentHeight: function() {
            const windowHeight = window.innerHeight;
            const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
            const footerHeight = document.querySelector('footer')?.offsetHeight || 0;
            const contentHeight = windowHeight - navbarHeight - footerHeight;
            
            // Adjust main content container height
            const mainContent = document.querySelector('.content-wrapper');
            if (mainContent) {
                mainContent.style.minHeight = `${contentHeight}px`;
            }
            
            // Adjust scroll containers
            const scrollContainers = document.querySelectorAll('.scroll-container');
            scrollContainers.forEach(container => {
                container.style.maxHeight = `${contentHeight * 0.9}px`;
            });
        },
        
        adjustFontSizes: function() {
            // Adjust headings based on container width
            const textElements = document.querySelectorAll('h1, h2, h3, p, .album-title');
            
            textElements.forEach(element => {
                const container = element.parentElement;
                const containerWidth = container.offsetWidth;
                
                // Reset font size for accurate measurement
                element.style.fontSize = '';
                
                // If text is overflowing
                if (element.scrollWidth > containerWidth) {
                    // Get the original font size
                    const originalSize = parseFloat(getComputedStyle(element).fontSize);
                    let fontSize = originalSize;
                    
                    // Reduce size until it fits or reaches minimum
                    while (element.scrollWidth > containerWidth && fontSize > originalSize * 0.7) {
                        fontSize -= 1;
                        element.style.fontSize = `${fontSize}px`;
                    }
                }
            });
        },
        
        setupScrollBehavior: function() {
            // Handle back-to-top button
            const backToTopBtn = document.querySelector('.back-to-top');
            if (backToTopBtn) {
                // Show/hide button based on scroll position
                window.addEventListener('scroll', () => {
                    if (window.pageYOffset > 300) {
                        backToTopBtn.style.display = 'flex';
                        backToTopBtn.style.opacity = '1';
                    } else {
                        backToTopBtn.style.opacity = '0';
                        setTimeout(() => {
                            if (window.pageYOffset <= 300) {
                                backToTopBtn.style.display = 'none';
                            }
                        }, 300);
                    }
                });
                
                // Scroll to top on click
                backToTopBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                });
            }
            
            // Add smooth scrolling to all anchor links
            document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    const href = this.getAttribute('href');
                    const target = document.querySelector(href);
                    
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        },
        
        setupResizeListener: function() {
            // Debounce function to limit execution of resize events
            const debounce = (func, delay) => {
                let timeout;
                return function() {
                    const context = this;
                    const args = arguments;
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(context, args), delay);
                };
            };
            
            // Handle window resize events with debouncing
            window.addEventListener('resize', debounce(() => {
                this.adjustContentHeight();
                this.adjustFontSizes();
                this.adjustNavigation();
                this.preserveImageStyles();
            }, 250));
            
            // Handle orientation change for mobile devices
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.adjustContentHeight();
                    this.adjustFontSizes();
                    this.adjustNavigation();
                    this.preserveImageStyles();
                }, 200);
            });
        },
        
        adjustNavigation: function() {
            // Handle responsive navigation
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                if (window.innerWidth < 992) {
                    // Mobile navigation adjustments
                    navbar.classList.add('navbar-mobile');
                    
                    // Fix offcanvas position on mobile
                    const offcanvasElements = document.querySelectorAll('[class*=offcanvas-]');
                    offcanvasElements.forEach(element => {
                        if (getComputedStyle(element).position !== 'fixed') {
                            element.style.position = 'fixed';
                        }
                    });
                } else {
                    // Desktop navigation
                    navbar.classList.remove('navbar-mobile');
                }
            }
        },
        
        preserveImageStyles: function() {
            // Make iframes responsive without affecting image styling
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                const wrapper = iframe.parentElement;
                if (!wrapper.classList.contains('iframe-wrapper')) {
                    // Create a wrapper if needed
                    const div = document.createElement('div');
                    div.classList.add('iframe-wrapper');
                    div.style.position = 'relative';
                    div.style.paddingBottom = '56.25%'; // 16:9 ratio
                    div.style.height = '0';
                    div.style.overflow = 'hidden';
                    
                    iframe.style.position = 'absolute';
                    iframe.style.top = '0';
                    iframe.style.left = '0';
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    
                    iframe.parentNode.insertBefore(div, iframe);
                    div.appendChild(iframe);
                }
            });
            
            // Add a back-to-top button if it doesn't exist
            if (!document.querySelector('.back-to-top')) {
                const backToTop = document.createElement('a');
                backToTop.classList.add('back-to-top');
                backToTop.innerHTML = '<i class="fas fa-chevron-up"></i>';
                backToTop.style.display = 'none';
                document.body.appendChild(backToTop);
            }
        }
    };
    
    // Initialize responsive layout
    responsiveLayout.init();
});