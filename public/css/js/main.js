document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navList = document.querySelector('.nav-list');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            navList.classList.toggle('active');
            this.classList.toggle('active');
            const expanded = this.getAttribute('aria-expanded') === 'true' || false;
            this.setAttribute('aria-expanded', !expanded);
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.getAttribute('href') !== '#') {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    window.scrollTo({
                        top: target.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Period selector for timesheet
    const periodOptions = document.querySelectorAll('.period-option');
    if (periodOptions.length > 0) {
        periodOptions.forEach(option => {
            option.addEventListener('click', function() {
                periodOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                
                // Check if custom date option is selected
                const isCustom = this.getAttribute('data-period') === 'custom';
                const customDates = document.querySelector('.custom-dates');
                if (customDates) {
                    customDates.style.display = isCustom ? 'flex' : 'none';
                }
            });
        });
    }
    
    // Filter chips for timesheet
    const filterChips = document.querySelectorAll('.filter-chip');
    if (filterChips.length > 0) {
        filterChips.forEach(chip => {
            chip.addEventListener('click', function() {
                this.classList.toggle('active');
            });
        });
    }
    
    // Countdown timer functionality
    function updateCountdown() {
        const countdownElement = document.getElementById('countdown-timer');
        if (!countdownElement) return;
        
        const timerBar = document.querySelector('.timer-bar');
        const initialTime = parseTimeString(countdownElement.textContent);
        let remainingSeconds = initialTime.hours * 3600 + initialTime.minutes * 60;
        
        if (remainingSeconds <= 0) return;
        
        // Calculate initial percentage
        const workDaySeconds = 8 * 3600; // 8 hours in seconds
        let initialPercentage = 100 - (remainingSeconds / workDaySeconds * 100);
        
        // Start timer immediately
        startTimer();

        function startTimer() {
            const timer = setInterval(() => {
                remainingSeconds -= 60; // Decrease by 1 minute (60 seconds)
                
                if (remainingSeconds <= 0) {
                    clearInterval(timer);
                    countdownElement.textContent = '0:00';
                    timerBar.style.width = '100%';
                    return;
                }
                
                const hours = Math.floor(remainingSeconds / 3600);
                const minutes = Math.floor((remainingSeconds % 3600) / 60);
                countdownElement.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
                
                // Update progress bar
                const percentage = 100 - (remainingSeconds / workDaySeconds * 100);
                timerBar.style.width = `${percentage}%`;
                
            }, 60000); // Update every minute
        }
        
        // Parse time string in format "H:MM"
        function parseTimeString(timeStr) {
            const [hours, minutes] = timeStr.split(':').map(part => parseInt(part, 10));
            return { hours, minutes };
        }
    }
    
    updateCountdown();
    
    // Add animation for cards
    const cards = document.querySelectorAll('.dashboard-card, .feature-card');
    if (cards.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        cards.forEach(card => {
            observer.observe(card);
        });
    }
    
    // Add hover effect for table rows
    const tableRows = document.querySelectorAll('.timesheet-table tbody tr');
    if (tableRows.length > 0) {
        tableRows.forEach(row => {
            row.addEventListener('mouseenter', () => {
                row.style.transition = 'background-color 0.3s ease';
                row.style.backgroundColor = 'rgba(74, 108, 253, 0.1)';
            });
            
            row.addEventListener('mouseleave', () => {
                row.style.backgroundColor = '';
            });
        });
    }
    
    // Add scroll animation for sections
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            if (sectionTop < windowHeight * 0.8) {
                section.classList.add('visible');
            }
        });
    });
    
    // FAQ accordion functionality
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    if (faqQuestions) {
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                const isActive = answer.classList.contains('active');
                
                // Close all other answers
                document.querySelectorAll('.faq-answer').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Toggle current answer
                if (!isActive) {
                    answer.classList.add('active');
                }
                
                // Toggle the indicator
                document.querySelectorAll('.faq-question').forEach(q => {
                    q.querySelector('.indicator').textContent = '+';
                });
                
                if (!isActive) {
                    question.querySelector('.indicator').textContent = '-';
                }
            });
        });
    }
    
    // Contact form option selection
    const contactOptions = document.querySelectorAll('.contact-option');
    const contactForm = document.querySelector('.contact-form');
    const immediateContact = document.querySelector('.immediate-contact');
    
    if (contactOptions && contactForm && immediateContact) {
        contactOptions.forEach(option => {
            option.addEventListener('click', function() {
                const optionType = this.getAttribute('data-type');
                
                if (optionType === 'form') {
                    contactForm.style.display = 'block';
                    immediateContact.style.display = 'none';
                } else if (optionType === 'immediate') {
                    contactForm.style.display = 'none';
                    immediateContact.style.display = 'block';
                }
            });
        });
    }
    
    // Apply Leave validation
    const applyLeaveBtn = document.getElementById('apply-leave-btn');
    const leavesRemaining = document.getElementById('leaves-remaining');
    
    if (applyLeaveBtn && leavesRemaining) {
        const remainingLeaves = parseInt(leavesRemaining.textContent);
        
        if (remainingLeaves <= 0) {
            applyLeaveBtn.classList.add('btn-disabled');
            applyLeaveBtn.disabled = true;
        }
    }
    
    // Timesheet page functionality
    const timesheetContainer = document.querySelector('.timesheet-table-container');
    if (!timesheetContainer) return;

    // Timer functionality
    const countdownTimer = document.getElementById('countdown-timer');
    const timerBar = document.querySelector('.timer-bar');
  
    if (countdownTimer) {
        // Update timer every second
        function updateTimer() {
            const timeString = countdownTimer.textContent;
            const timeParts = timeString.split(':');
            
            let hours = parseInt(timeParts[0]);
            let minutes = parseInt(timeParts[1]);
            
            // Decrease minute
            minutes -= 1;
            
            // Handle minute rollover
            if (minutes < 0) {
                minutes = 59;
                hours -= 1;
            }
            
            // Update display
            countdownTimer.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
            
            // Update progress bar - assuming 8-hour workday
            const totalSeconds = hours * 3600 + minutes * 60;
            const totalWorkSeconds = 8 * 3600;
            const percentComplete = 100 - ((totalSeconds / totalWorkSeconds) * 100);
            
            if (timerBar) {
                timerBar.style.width = `${percentComplete}%`;
            }
            
            // Change color based on remaining time
            if (hours === 0 && minutes < 30) {
                countdownTimer.style.color = 'var(--danger-color)';
            } else if (hours === 0 && minutes < 60) {
                countdownTimer.style.color = 'var(--warning-color)';
            }
            
            // Stop if time reaches 0
            if (hours === 0 && minutes === 0) {
                clearInterval(timerInterval);
                countdownTimer.textContent = 'Time\'s up!';
            }
        }
        
        // Only start timer if not at 0 already
        const timeString = countdownTimer.textContent;
        const timeParts = timeString.split(':');
        
        let timerInterval;
        if (parseInt(timeParts[0]) > 0 || parseInt(timeParts[1]) > 0) {
            timerInterval = setInterval(updateTimer, 60000); // Update every minute
            // Run once immediately to see the effect
            updateTimer();
        }
    }
    
    // Quick filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Show loading state
                const tableBody = document.querySelector('.timesheet-table tbody');
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';
                
                // In a real implementation, this would fetch data from the server
                // For demo, simulate loading
                setTimeout(() => {
                    // Reset table with new dummy data based on filter
                    populateDummyData(this.textContent.toLowerCase());
                }, 800);
            });
        });
    }
    
    // Action buttons
    const actionButtons = document.querySelectorAll('.action-btn');
    if (actionButtons.length) {
        actionButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.textContent.trim().toLowerCase();
                
                // Show feedback
                const feedbackMsg = document.createElement('div');
                feedbackMsg.classList.add('action-feedback');
                
                if (action.includes('start')) {
                    feedbackMsg.textContent = 'Work session started!';
                    feedbackMsg.classList.add('success-feedback');
                } else if (action.includes('break')) {
                    feedbackMsg.textContent = 'Break started. Timer paused.';
                    feedbackMsg.classList.add('warning-feedback');
                } else if (action.includes('end')) {
                    feedbackMsg.textContent = 'Workday ended! See you tomorrow.';
                    feedbackMsg.classList.add('info-feedback');
                }
                
                // Append feedback to actions panel
                const actionsPanel = document.querySelector('.action-panel .panel-body');
                actionsPanel.appendChild(feedbackMsg);
                
                // Remove feedback after 3 seconds
                setTimeout(() => {
                    feedbackMsg.classList.add('fade-out');
                    setTimeout(() => {
                        actionsPanel.removeChild(feedbackMsg);
                    }, 500);
                }, 3000);
            });
        });
    }
    
    // Row action buttons
    const rowActionButtons = document.querySelectorAll('.row-action-btn');
    if (rowActionButtons.length) {
        rowActionButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.getAttribute('title').toLowerCase();
                const row = this.closest('tr');
                
                if (action === 'edit') {
                    // In a real app, this would open an edit form
                    row.classList.add('highlight-row');
                    setTimeout(() => {
                        row.classList.remove('highlight-row');
                    }, 2000);
                } else if (action === 'view details') {
                    // In a real app, this would open a details modal
                    // For demo, toggle a details row
                    const nextRow = row.nextElementSibling;
                    
                    if (nextRow && nextRow.classList.contains('details-row')) {
                        nextRow.remove();
                    } else {
                        const detailsRow = document.createElement('tr');
                        detailsRow.classList.add('details-row');
                        
                        const detailsCell = document.createElement('td');
                        detailsCell.setAttribute('colspan', '7');
                        detailsCell.innerHTML = `
                            <div class="details-content">
                                <h4>Time Entry Details</h4>
                                <div class="details-grid">
                                    <div class="detail-item">
                                        <span class="detail-label">Status:</span>
                                        <span class="detail-value">Completed</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Tasks:</span>
                                        <span class="detail-value">Development, Meetings</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Notes:</span>
                                        <span class="detail-value">Worked on UI improvements and attended team meeting</span>
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        detailsRow.appendChild(detailsCell);
                        row.after(detailsRow);
                    }
                }
            });
        });
    }
    
    // Helper function to populate table with dummy data
    function populateDummyData(filter) {
        const tableBody = document.querySelector('.timesheet-table tbody');
        let dummyData = [];
        
        // Generate different dummy data based on filter
        if (filter === 'daily' || filter === 'this week') {
            dummyData = [
                { date: 'Today', login: '9:00 AM', logout: '5:30 PM', pause: '45 min', unavailable: '15 min', totalAvailable: '7.5 hrs' },
                { date: 'Yesterday', login: '8:45 AM', logout: '5:15 PM', pause: '60 min', unavailable: '30 min', totalAvailable: '7.0 hrs' }
            ];
        } else if (filter === 'weekly' || filter === 'last week') {
            dummyData = [
                { date: 'Mon, June 10', login: '9:00 AM', logout: '5:30 PM', pause: '45 min', unavailable: '15 min', totalAvailable: '7.5 hrs' },
                { date: 'Tue, June 11', login: '8:45 AM', logout: '5:15 PM', pause: '60 min', unavailable: '30 min', totalAvailable: '7.0 hrs' },
                { date: 'Wed, June 12', login: '9:15 AM', logout: '6:00 PM', pause: '30 min', unavailable: '0 min', totalAvailable: '8.25 hrs' },
                { date: 'Thu, June 13', login: '8:30 AM', logout: '4:45 PM', pause: '45 min', unavailable: '15 min', totalAvailable: '7.25 hrs' },
                { date: 'Fri, June 14', login: '9:00 AM', logout: '5:00 PM', pause: '45 min', unavailable: '0 min', totalAvailable: '7.25 hrs' }
            ];
        } else {
            dummyData = [
                { date: 'Week 23', login: '-', logout: '-', pause: '-', unavailable: '-', totalAvailable: '37.5 hrs' },
                { date: 'Week 24', login: '-', logout: '-', pause: '-', unavailable: '-', totalAvailable: '40.0 hrs' },
                { date: 'Week 25', login: '-', logout: '-', pause: '-', unavailable: '-', totalAvailable: '35.75 hrs' },
                { date: 'Week 26', login: '-', logout: '-', pause: '-', unavailable: '-', totalAvailable: '32.5 hrs' }
            ];
        }
        
        // Clear table and add new rows
        tableBody.innerHTML = '';
        
        dummyData.forEach(entry => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${entry.date}</td>
                <td>${entry.login}</td>
                <td>${entry.logout}</td>
                <td>${entry.pause}</td>
                <td>${entry.unavailable}</td>
                <td>${entry.totalAvailable}</td>
                <td class="row-actions">
                    <button class="row-action-btn" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="row-action-btn" title="View Details"><i class="fas fa-eye"></i></button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Reattach event listeners to new row action buttons
        const newRowActionButtons = document.querySelectorAll('.row-action-btn');
        if (newRowActionButtons.length) {
            newRowActionButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const action = this.getAttribute('title').toLowerCase();
                    const row = this.closest('tr');
                    
                    if (action === 'edit') {
                        row.classList.add('highlight-row');
                        setTimeout(() => {
                            row.classList.remove('highlight-row');
                        }, 2000);
                    } else if (action === 'view details') {
                        const nextRow = row.nextElementSibling;
                        
                        if (nextRow && nextRow.classList.contains('details-row')) {
                            nextRow.remove();
                        } else {
                            const detailsRow = document.createElement('tr');
                            detailsRow.classList.add('details-row');
                            
                            const detailsCell = document.createElement('td');
                            detailsCell.setAttribute('colspan', '7');
                            detailsCell.innerHTML = `
                                <div class="details-content">
                                    <h4>Time Entry Details</h4>
                                    <div class="details-grid">
                                        <div class="detail-item">
                                            <span class="detail-label">Status:</span>
                                            <span class="detail-value">Completed</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">Tasks:</span>
                                            <span class="detail-value">Development, Meetings</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">Notes:</span>
                                            <span class="detail-value">Worked on UI improvements and attended team meeting</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                            
                            detailsRow.appendChild(detailsCell);
                            row.after(detailsRow);
                        }
                    }
                });
            });
        }
    }
});

// Time Tracking Functionality
document.addEventListener('DOMContentLoaded', () => {
    setupTimeTracking();
});

function setupTimeTracking() {
    // Clock In button
    const clockInBtn = document.getElementById('clockInBtn');
    if (clockInBtn) {
        clockInBtn.addEventListener('click', () => {
            sendTimeTrackingRequest('/api/clock-in')
                .then(data => {
                    if (data.success) {
                        showNotification('Clocked in successfully!', 'success');
                        reloadPage();
                    }
                })
                .catch(error => {
                    showNotification(error, 'error');
                });
        });
    }
    
    // Clock Out button
    const clockOutBtn = document.getElementById('clockOutBtn');
    if (clockOutBtn) {
        clockOutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clock out?')) {
                sendTimeTrackingRequest('/api/clock-out')
                    .then(data => {
                        if (data.success) {
                            showNotification('Clocked out successfully!', 'success');
                            reloadPage();
                        }
                    })
                    .catch(error => {
                        showNotification(error, 'error');
                    });
            }
        });
    }
    
    // Start Break button
    const startBreakBtn = document.getElementById('startBreakBtn');
    if (startBreakBtn) {
        startBreakBtn.addEventListener('click', () => {
            sendTimeTrackingRequest('/api/start-break')
                .then(data => {
                    if (data.success) {
                        showNotification('Break started!', 'warning');
                        reloadPage();
                    }
                })
                .catch(error => {
                    showNotification(error, 'error');
                });
        });
    }
    
    // End Break button
    const endBreakBtn = document.getElementById('endBreakBtn');
    if (endBreakBtn) {
        endBreakBtn.addEventListener('click', () => {
            sendTimeTrackingRequest('/api/end-break')
                .then(data => {
                    if (data.success) {
                        showNotification('Break ended!', 'success');
                        reloadPage();
                    }
                })
                .catch(error => {
                    showNotification(error, 'error');
                });
        });
    }
    
    // Start Unavailable button
    const startUnavailableBtn = document.getElementById('startUnavailableBtn');
    if (startUnavailableBtn) {
        startUnavailableBtn.addEventListener('click', () => {
            sendTimeTrackingRequest('/api/start-unavailable')
                .then(data => {
                    if (data.success) {
                        showNotification('Marked as unavailable!', 'warning');
                        reloadPage();
                    }
                })
                .catch(error => {
                    showNotification(error, 'error');
                });
        });
    }
    
    // End Unavailable button
    const endUnavailableBtn = document.getElementById('endUnavailableBtn');
    if (endUnavailableBtn) {
        endUnavailableBtn.addEventListener('click', () => {
            sendTimeTrackingRequest('/api/end-unavailable')
                .then(data => {
                    if (data.success) {
                        showNotification('Marked as available!', 'success');
                        reloadPage();
                    }
                })
                .catch(error => {
                    showNotification(error, 'error');
                });
        });
    }
    
    // Auto-refresh timesheet status
    if (document.querySelector('.time-tracking-panel')) {
        setInterval(updateTimesheetStatus, 60000); // Update every minute
    }
}

// Helper function for time tracking API requests
async function sendTimeTrackingRequest(url, method = 'POST') {
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error.message || 'Network error';
    }
}

// Update timesheet status without full page reload
async function updateTimesheetStatus() {
    try {
        const response = await fetch('/api/timesheet-status');
        const data = await response.json();
        
        // Update countdown timer
        const countdownElement = document.getElementById('countdown-timer');
        if (countdownElement && data.activeEntry) {
            updateCountdown();
        }
        
    } catch (error) {
        console.error('Error updating timesheet status:', error);
    }
}

// Helper function to reload the page
function reloadPage() {
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// Notification system
function showNotification(message, type) {
    // Create notification container if it doesn't exist
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.add('hiding');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('hiding');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Add notification styles dynamically
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .notification {
        min-width: 300px;
        padding: 15px;
        border-radius: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        animation: slideIn 0.3s ease;
        transition: all 0.3s ease;
    }
    
    .notification.hiding {
        opacity: 0;
        transform: translateX(100%);
    }
    
    .notification.success {
        background-color: rgba(46, 213, 115, 0.2);
        border-left: 4px solid var(--success);
        color: var(--success);
    }
    
    .notification.error {
        background-color: rgba(246, 71, 71, 0.2);
        border-left: 4px solid var(--danger);
        color: var(--danger);
    }
    
    .notification.warning {
        background-color: rgba(245, 171, 53, 0.2);
        border-left: 4px solid var(--warning);
        color: var(--warning);
    }
    
    .notification-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: currentColor;
        opacity: 0.7;
        transition: opacity 0.3s ease;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(notificationStyles);
