const express = require('express');
const router = express.Router();
const db = require('../config/sqliteConn');
const bcrypt = require('bcrypt');

// Helper function to get timesheet data
async function getTimesheetData() {
    try {
        // Get current date for calculations
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Get all employees
        const employees = await db.all(`
            SELECT id, name, username 
            FROM users 
            WHERE role = 'employee' AND active = 1
        `);
        
        // Get approved leaves
        const leaves = await db.all(`
            SELECT employee_id as employeeId, start_date as start_date, end_date as end_date
            FROM leaves
            WHERE status = 'approved' 
            AND end_date >= date('now', '-30 days')
        `);
        
        // Get submitted timesheets
        const submittedTimesheets = await db.all(`
            SELECT employee_id as employeeId, date, hours_worked as hoursWorked
            FROM timesheets
            WHERE date >= date('now', '-30 days')
        `);
        
        // Generate complete timesheet data for all employees
        const allTimesheets = [];
        
        // Use the last 30 days
        for (let i = 0; i < 30; i++) {
            const date = new Date(currentYear, currentMonth, today.getDate() - i);
            // Skip weekends in our dataset
            if (date.getDay() === 0 || date.getDay() === 6) continue;
            
            employees.forEach(employee => {
                // Check if employee is on leave for this date
                const onLeave = leaves.some(leave => {
                    const startDate = new Date(leave.start_date);
                    const endDate = new Date(leave.end_date);
                    return leave.employeeId === employee.id && 
                           date >= startDate && 
                           date <= endDate;
                });
                
                // Check if employee has submitted a timesheet for this date
                const submitted = submittedTimesheets.find(ts => 
                    ts.employeeId === employee.id && 
                    new Date(ts.date).toDateString() === date.toDateString()
                );
                
                let status, hoursWorked, missing;
                
                if (onLeave) {
                    status = 'leave';
                    hoursWorked = 0;
                    missing = false;
                } else if (submitted) {
                    status = 'submitted';
                    hoursWorked = submitted.hoursWorked;
                    missing = false;
                } else {
                    status = 'missing';
                    hoursWorked = 0;
                    missing = true;
                }
                
                // Add timesheet entry
                allTimesheets.push({
                    employeeId: employee.id,
                    employeeName: employee.name,
                    date: date,
                    hoursWorked: hoursWorked,
                    status: status,
                    missing: missing
                });
            });
        }
        
        return allTimesheets;
    } catch (error) {
        console.error('Error generating timesheet data:', error);
        return [];
    }
}

// API endpoint for timesheet data
router.get('/timesheets', async (req, res) => {
    try {
        const timesheets = await getTimesheetData();
        res.json(timesheets);
    } catch (error) {
        console.error('Error fetching timesheets:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get users for admin dashboard
router.get('/', function(req, res, next) {
  req.checkAdmin(req, res, next);
}, async (req, res) => {
    try {
        // Get all users
        const users = await db.all(`
            SELECT id, username, name, role, active, email
            FROM users
            ORDER BY name
        `);
        
        // Get timesheet data
        const timesheets = await getTimesheetData();
        
        // Render admin page with both datasets
        res.render('admin', {
            users: users || [], // Provide empty array fallback
            timesheets: timesheets || [],
            activePage: 'admin',
            currentUser: req.session.user
        });
    } catch (error) {
        console.error('Error fetching admin data:', error);
        // Render with empty datasets on error
        res.render('admin', {
            users: [],
            timesheets: [],
            activePage: 'admin',
            currentUser: req.session.user,
            error: 'Failed to load user data'
        });
    }
});

// Create new user API endpoint
router.post('/api/users', function(req, res, next) {
  req.checkAdmin(req, res, next);
}, async (req, res) => {
    try {
        const { username, fullName, email, role, password } = req.body;
        
        // Check if username exists
        const existingUser = await db.get('SELECT username FROM users WHERE username = ?', [username]);
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert new user
        const result = await db.run(`
            INSERT INTO users (username, name, email, role, password, active)
            VALUES (?, ?, ?, ?, ?, 1)
        `, [username, fullName, email, role, hashedPassword]);
        
        res.status(201).json({
            message: 'User created successfully',
            userId: result.lastID
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user API endpoint
router.delete('/api/users/:id', function(req, res, next) {
  req.checkAdmin(req, res, next);
}, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Don't allow deleting your own account
        if (req.session.user && req.session.user.id === parseInt(id)) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }
        
        await db.run('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

document.addEventListener('DOMContentLoaded', function() {
    // Form for adding new users
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                username: document.getElementById('username').value,
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                role: document.getElementById('role').value,
                password: document.getElementById('password').value
            };
            
            // Validate form data
            if (!formData.username || !formData.fullName || !formData.email || 
                !formData.role || !formData.password) {
                alert('All fields are required');
                return;
            }
            
            try {
                const response = await fetch('/admin/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert('User created successfully');
                    window.location.reload();
                } else {
                    alert(`Error: ${data.message || 'Failed to create user'}`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while creating the user');
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        const refreshActivityBtn = document.getElementById('refreshActivityBtn');
        if (refreshActivityBtn) {
          refreshActivityBtn.addEventListener('click', function() {
            fetch('/admin/api/employee-activity')
              .then(response => response.json())
              .then(data => {
                // Update the table with new data
                const tableBody = document.querySelector('#employeeActivityTable tbody');
                tableBody.innerHTML = '';
                
                data.forEach(employee => {
                  const row = document.createElement('tr');
                  if (employee.missing) row.classList.add('table-danger');
                  else if (employee.onLeave) row.classList.add('table-secondary');
                  
                  row.innerHTML = `
                    <td>${employee.name}</td>
                    <td>
                      ${employee.onLeave 
                        ? '<span class="badge bg-info">On Leave</span>' 
                        : employee.status === 'checked-in' 
                          ? '<span class="badge bg-success">Checked In</span>'
                          : '<span class="badge bg-warning text-dark">Not Checked In</span>'
                      }
                    </td>
                    <td>${employee.checkInTime || 'N/A'}</td>
                    <td>
                      ${employee.breakStatus === 'on-break'
                        ? '<span class="badge bg-primary">On Break</span>'
                        : employee.breakStatus === 'unavailable'
                          ? '<span class="badge bg-secondary">Unavailable</span>'
                          : '<span class="badge bg-light text-dark">None</span>'
                      }
                    </td>
                    <td>
                      ${employee.missing ? '<i class="fas fa-exclamation-triangle text-danger"></i>' : ''}
                    </td>
                  `;
                  
                  tableBody.appendChild(row);
                });
              })
              .catch(error => console.error('Error refreshing activity data:', error));
          });
          
          // Auto-refresh every 60 seconds
          setInterval(() => {
            refreshActivityBtn.click();
          }, 60000);
        }
      });
    
    // Handle delete user buttons
    const deleteButtons = document.querySelectorAll('.delete-user');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const userId = this.getAttribute('data-user-id');
            
            if (confirm('Are you sure you want to delete this user?')) {
                try {
                    const response = await fetch(`/admin/api/users/${userId}`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        alert('User deleted successfully');
                        // Remove the row from the table or reload
                        const row = this.closest('tr');
                        if (row) row.remove();
                    } else {
                        const data = await response.json();
                        alert(`Error: ${data.message || 'Failed to delete user'}`);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('An error occurred while deleting the user');
                }
            }
        });
    });
    
    // Add other admin dashboard functionality here
});

// Employee Activity functionality
document.addEventListener('DOMContentLoaded', function() {
    // Search functionality
    const searchInput = document.getElementById('employeeSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#employeeActivityTable tbody tr');
            
            rows.forEach(row => {
                const employeeName = row.querySelector('td:first-child strong').textContent.toLowerCase();
                const employeeEmail = row.querySelector('td:first-child small').textContent.toLowerCase();
                
                if (employeeName.includes(searchTerm) || employeeEmail.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    // Refresh button functionality
    const refreshBtn = document.getElementById('refreshActivityBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            // Show loading state
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            
            // Fetch updated data
            fetch('/admin/api/employee-activity')
                .then(response => response.json())
                .then(data => {
                    updateActivityTable(data);
                    updateActivitySummary(data);
                })
                .catch(error => console.error('Error fetching activity data:', error))
                .finally(() => {
                    // Restore button state
                    this.disabled = false;
                    this.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
                });
        });
    }
    
    // Calculate and update work durations
    updateDurations();
    setInterval(updateDurations, 60000); // Update every minute
    
    // Action button handlers
    setupActionButtons();
});

// Update durations for checked-in employees
function updateDurations() {
    const durationElements = document.querySelectorAll('.duration[data-checkin]');
    const now = new Date();
    
    durationElements.forEach(element => {
        const checkinTime = element.getAttribute('data-checkin');
        if (!checkinTime) return;
        
        // Parse HH:MM format
        const [hours, minutes] = checkinTime.split(':').map(Number);
        const checkin = new Date();
        checkin.setHours(hours, minutes, 0);
        
        // If check-in is tomorrow (due to date rollover), adjust
        if (checkin > now) {
            checkin.setDate(checkin.getDate() - 1);
        }
        
        // Calculate duration
        const diffMs = now - checkin;
        const diffMins = Math.floor(diffMs / 60000);
        const durationHours = Math.floor(diffMins / 60);
        const durationMins = diffMins % 60;
        
        // Update the display
        element.querySelector('.hours').textContent = durationHours.toString().padStart(2, '0');
        element.querySelector('.minutes').textContent = durationMins.toString().padStart(2, '0');
    });
}

// Setup action button handlers
function setupActionButtons() {
    // Send reminder buttons
    document.querySelectorAll('.send-reminder').forEach(button => {
        button.addEventListener('click', function() {
            const employeeId = this.getAttribute('data-employee-id');
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            // Simulate sending a reminder
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-check"></i> Sent';
                // In a real app, you'd make an API call here
            }, 1500);
        });
    });
    
    // View details buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function() {
            const employeeId = this.getAttribute('data-employee-id');
            // In a real app, you'd show a modal with employee details
            alert(`View detailed activity for employee #${employeeId}`);
        });
    });
}

// Update the activity table with new data
function updateActivityTable(data) {
    const tableBody = document.querySelector('#employeeActivityTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    data.forEach(employee => {
        const row = document.createElement('tr');
        
        if (employee.missing) row.classList.add('table-danger');
        else if (employee.onLeave) row.classList.add('table-secondary');
        else if (employee.breakStatus === 'on-break') row.classList.add('table-info');
        
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="status-indicator ${employee.status === 'checked-in' ? 'online' : 'offline'}"></div>
                    <strong>${employee.name}</strong>
                </div>
                <small class="text-muted">${employee.email}</small>
            </td>
            <td>
                ${employee.onLeave 
                    ? '<span class="badge bg-info"><i class="fas fa-umbrella-beach"></i> On Leave</span>' 
                    : employee.status === 'checked-in' 
                        ? '<span class="badge bg-success"><i class="fas fa-check-circle"></i> Present</span>'
                        : '<span class="badge bg-warning text-dark"><i class="fas fa-exclamation-circle"></i> Not Checked In</span>'
                }
            </td>
            <td>
                ${employee.checkInTime 
                    ? `<span class="time"><i class="far fa-clock"></i> ${employee.checkInTime}</span>`
                    : '<span class="text-muted">N/A</span>'
                }
            </td>
            <td>
                ${employee.checkInTime 
                    ? `<span class="duration" data-checkin="${employee.checkInTime}">
                        <span class="hours">--</span>:<span class="minutes">--</span>
                      </span>`
                    : '<span class="text-muted">N/A</span>'
                }
            </td>
            <td>
                ${!employee.status === 'checked-in' || employee.onLeave
                    ? '<span class="text-muted">N/A</span>'
                    : employee.breakStatus === 'on-break'
                        ? '<span class="badge bg-primary"><i class="fas fa-coffee"></i> On Break</span>'
                        : employee.breakStatus === 'unavailable'
                            ? '<span class="badge bg-secondary"><i class="fas fa-user-clock"></i> Unavailable</span>'
                            : '<span class="badge bg-light text-dark"><i class="fas fa-briefcase"></i> Working</span>'
                }
            </td>
            <td>
                ${employee.missing && !employee.onLeave
                    ? `<button class="btn btn-warning btn-sm send-reminder" data-employee-id="${employee.id}">
                        <i class="fas fa-bell"></i> Remind
                       </button>`
                    : employee.status === 'checked-in'
                        ? `<button class="btn btn-primary btn-sm view-details" data-employee-id="${employee.id}">
                            <i class="fas fa-eye"></i> Details
                           </button>`
                        : '<span class="text-muted"><i class="fas fa-minus-circle"></i> No Action</span>'
                }
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Update durations immediately
    updateDurations();
    
    // Re-attach event listeners
    setupActionButtons();
}

// Update the activity summary numbers
function updateActivitySummary(data) {
    const presentCount = data.filter(e => e.status === 'checked-in' && !e.onLeave).length;
    const breakCount = data.filter(e => e.breakStatus === 'on-break').length;
    const absentCount = data.filter(e => e.missing).length;
    const leaveCount = data.filter(e => e.onLeave).length;
    
    document.getElementById('presentCount').textContent = presentCount;
    document.getElementById('breakCount').textContent = breakCount;
    document.getElementById('absentCount').textContent = absentCount;
    document.getElementById('leaveCount').textContent = leaveCount;
}

// Add these functions to your existing admin.js file

// Employee Activity Management
document.addEventListener('DOMContentLoaded', function() {
    // Activity filtering
    const activityFilter = document.getElementById('activityFilter');
    if (activityFilter) {
        activityFilter.addEventListener('change', function() {
            filterActivityByStatus(this.value);
        });
    }
    
    // Employee search
    const searchInput = document.getElementById('employeeSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            filterActivityBySearch(this.value);
        });
    }
    
    // Initialize pagination for both views
    initializePagination('activityTableBody', '#activityPagination', 10);
    initializePagination('employeeActivityGrid', '#gridPagination', 12);
    
    // Handle page size change
    const pageSizeSelect = document.getElementById('activityPageSize');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', function() {
            const pageSize = parseInt(this.value);
            initializePagination('activityTableBody', '#activityPagination', pageSize);
        });
    }
    
    // Update durations
    updateAllDurations();
    setInterval(updateAllDurations, 60000); // Update every minute
});

// Filter activity by status
function filterActivityByStatus(status) {
    const tableRows = document.querySelectorAll('#activityTableBody tr');
    const gridItems = document.querySelectorAll('#employeeActivityGrid .col');
    
    if (status === 'all') {
        tableRows.forEach(row => row.style.display = '');
        gridItems.forEach(item => item.style.display = '');
    } else {
        tableRows.forEach(row => {
            row.style.display = row.dataset.status === status ? '' : 'none';
        });
        
        gridItems.forEach(item => {
            item.style.display = item.dataset.status === status ? '' : 'none';
        });
    }
}

// Filter by search term
function filterActivityBySearch(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    
    // Filter table view
    const tableRows = document.querySelectorAll('#activityTableBody tr');
    tableRows.forEach(row => {
        const employeeName = row.querySelector('strong').textContent.toLowerCase();
        const employeeEmail = row.querySelector('small').textContent.toLowerCase();
        row.style.display = (employeeName.includes(searchTerm) || employeeEmail.includes(searchTerm)) ? '' : 'none';
    });
    
    // Filter grid view
    const gridItems = document.querySelectorAll('#employeeActivityGrid .col');
    gridItems.forEach(item => {
        const employeeName = item.querySelector('.card-header h6').textContent.toLowerCase();
        const employeeEmail = item.querySelector('.card-text.small').textContent.toLowerCase();
        item.style.display = (employeeName.includes(searchTerm) || employeeEmail.includes(searchTerm)) ? '' : 'none';
    });
}

// Initialize pagination
function initializePagination(containerId, paginationSelector, itemsPerPage) {
    const container = document.getElementById(containerId) || document.querySelector(containerId);
    const pagination = document.querySelector(paginationSelector);
    
    if (!container || !pagination) return;
    
    const items = container.tagName === 'TBODY' ? container.querySelectorAll('tr') : container.children;
    const totalPages = Math.ceil(items.length / itemsPerPage);
    
    // Hide all items first
    Array.from(items).forEach(item => item.style.display = 'none');
    
    // Show first page
    for (let i = 0; i < Math.min(itemsPerPage, items.length); i++) {
        items[i].style.display = '';
    }
    
    // Update pagination
    updatePaginationUI(pagination, 1, totalPages, function(page) {
        Array.from(items).forEach((item, index) => {
            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            item.style.display = (index >= start && index < end) ? '' : 'none';
        });
    });
}

// Update pagination UI
function updatePaginationUI(pagination, currentPage, totalPages, onPageChange) {
    pagination.innerHTML = '';
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.textContent = 'Previous';
    if (currentPage > 1) {
        prevLink.addEventListener('click', function(e) {
            e.preventDefault();
            updatePaginationUI(pagination, currentPage - 1, totalPages, onPageChange);
            onPageChange(currentPage - 1);
        });
    }
    prevLi.appendChild(prevLink);
    pagination.appendChild(prevLi);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        // Only show 5 pages max with ellipsis
        if (totalPages > 7) {
            if (i !== 1 && i !== totalPages && 
                (i < currentPage - 2 || i > currentPage + 2) && 
                i !== currentPage) {
                if (i === 2 || i === totalPages - 1) {
                    const ellipsisLi = document.createElement('li');
                    ellipsisLi.className = 'page-item disabled';
                    const ellipsisLink = document.createElement('a');
                    ellipsisLink.className = 'page-link';
                    ellipsisLink.textContent = '...';
                    ellipsisLi.appendChild(ellipsisLink);
                    pagination.appendChild(ellipsisLi);
                }
                continue;
            }
        }
        
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        const link = document.createElement('a');
        link.className = 'page-link';
        link.href = '#';
        link.textContent = i;
        link.addEventListener('click', function(e) {
            e.preventDefault();
            updatePaginationUI(pagination, i, totalPages, onPageChange);
            onPageChange(i);
        });
        li.appendChild(link);
        pagination.appendChild(li);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.textContent = 'Next';
    if (currentPage < totalPages) {
        nextLink.addEventListener('click', function(e) {
            e.preventDefault();
            updatePaginationUI(pagination, currentPage + 1, totalPages, onPageChange);
            onPageChange(currentPage + 1);
        });
    }
    nextLi.appendChild(nextLink);
    pagination.appendChild(nextLi);
}

// Update all duration displays
function updateAllDurations() {
    const durationElements = document.querySelectorAll('.duration[data-checkin]');
    const now = new Date();
    
    durationElements.forEach(element => {
        const checkinTime = element.getAttribute('data-checkin');
        if (!checkinTime) return;
        
        // Parse HH:MM format
        const [hours, minutes] = checkinTime.split(':').map(Number);
        const checkin = new Date();
        checkin.setHours(hours, minutes, 0);
        
        // If check-in is tomorrow (due to date rollover), adjust
        if (checkin > now) {
            checkin.setDate(checkin.getDate() - 1);
        }
        
        // Calculate duration
        const diffMs = now - checkin;
        const diffMins = Math.floor(diffMs / 60000);
        const durationHours = Math.floor(diffMins / 60);
        const durationMins = diffMins % 60;
        
        // Update the display
        element.querySelector('.hours').textContent = durationHours.toString().padStart(2, '0');
        element.querySelector('.minutes').textContent = durationMins.toString().padStart(2, '0');
    });
}

// Add this to your admin.js file

// Handle the user creation form submission
document.addEventListener('DOMContentLoaded', function() {
    const addUserForm = document.getElementById('addUserForm');
    
    if (addUserForm) {
        addUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const role = document.getElementById('role').value;
            const password = document.getElementById('password').value;
            
            // Clear any previous error messages
            const errorAlert = document.querySelector('#addUserModal .alert');
            if (errorAlert) errorAlert.remove();
            
            // Send the form data
            fetch('/admin/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    fullName,
                    email,
                    role,
                    password
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    // Show error message
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'alert alert-danger';
                    errorDiv.textContent = data.message;
                    
                    const modalBody = document.querySelector('#addUserModal .modal-body');
                    modalBody.insertBefore(errorDiv, modalBody.firstChild);
                } else {
                    // Success - close modal and refresh user list
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
                    modal.hide();
                    
                    // Show success toast
                    showToast('User Created', 'New user has been created successfully.', 'success');
                    
                    // Refresh the user list
                    location.reload();
                }
            })
            .catch(error => {
                console.error('Error creating user:', error);
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-danger';
                errorDiv.textContent = 'An error occurred while creating the user.';
                
                const modalBody = document.querySelector('#addUserModal .modal-body');
                modalBody.insertBefore(errorDiv, modalBody.firstChild);
            });
        });
    }
});

// Helper function to show toast notifications
function showToast(title, message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container') || (() => {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
        return container;
    })();
    
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center border-0 bg-${type}`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <strong>${title}</strong>: ${message}
            </div>
            <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
    
    // Auto-remove after it's hidden
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}