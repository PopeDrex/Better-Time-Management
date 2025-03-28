/**
 * Admin Dashboard Client-Side JavaScript
 * Organized in a modular pattern for better maintainability
 */
/**
 * Utility functions for common operations
 */
const Utils = {
    // Clean up any lingering modal backdrops
    cleanupModals() {
        // Remove any lingering modal backdrops
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        
        // Remove modal-open class from body
        document.body.classList.remove('modal-open');
        
        // Reset body styles that might have been added by modal
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    },
    
    // Show nice notifications/alerts
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(alertDiv, mainContent.firstChild);
            
            setTimeout(() => {
                alertDiv.classList.remove('show');
                setTimeout(() => alertDiv.remove(), 150);
            }, 5000);
        }
    },

    // Handle API responses and errors consistently
    async fetchAPI(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            Utils.showAlert(error.message || 'An error occurred', 'danger');
            throw error;
        }
    }
};

/**
 * UI initialization and bootstrap components
 */
const UI = {
    init() {
        this.initBootstrapComponents();
    },
    
    initBootstrapComponents() {
        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
        
        // Initialize popovers
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    }
};

/**
 * User Management Module
 */
const UserManagement = {
    init() {
        this.initAddUserForm();
        this.initDeleteUserButtons();
        this.initPasswordToggle();
    },
    
    initAddUserForm() {
        const addUserForm = document.getElementById('addUserForm');
        const addUserModal = document.getElementById('addUserModal');
        
        if (!addUserForm || !addUserModal) return;
        
        // Initialize modal object
        const modal = new bootstrap.Modal(addUserModal);
        
        // Handle form submission
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
                Utils.showAlert('All fields are required', 'warning');
                return;
            }
            
            try {
                // Submit data to server
                await Utils.fetchAPI('/admin/api/users', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                
                // Properly hide the modal
                modal.hide();
                
                // Clean up modal backdrop to ensure it's properly removed
                setTimeout(() => {
                    Utils.cleanupModals();
                }, 300);
                
                // Success - just show notification and reload page
                Utils.showAlert('User created successfully!', 'success');
                
                // Simply reload the page - this will reset everything
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                
            } catch (error) {
                // Error is already handled in fetchAPI
            }
        });
        
        // Reset form when modal is closed
        addUserModal.addEventListener('hidden.bs.modal', function() {
            addUserForm.reset();
            const passwordInput = document.getElementById('password');
            if (passwordInput) passwordInput.setAttribute('type', 'password');
            
            const toggleBtn = document.getElementById('togglePassword');
            if (toggleBtn) {
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-eye');
                    icon.classList.remove('fa-eye-slash');
                }
            }
            
            // Make sure modal backdrop is cleaned up
            Utils.cleanupModals();
        });
    },
    
    initDeleteUserButtons() {
        const deleteButtons = document.querySelectorAll('.delete-user');
        
        deleteButtons.forEach(button => {
            button.addEventListener('click', async function() {
                const userId = this.getAttribute('data-user-id');
                
                if (!userId || !confirm('Are you sure you want to delete this user?')) {
                    return;
                }
                
                try {
                    await Utils.fetchAPI(`/admin/api/users/${userId}`, {
                        method: 'DELETE'
                    });
                    
                    Utils.showAlert('User deleted successfully', 'success');
                    
                    // Reload to update the user list
                    setTimeout(() => window.location.reload(), 1000);
                } catch (error) {
                    // Error is already handled in fetchAPI
                }
            });
        });
    },
    
    initPasswordToggle() {
        const togglePasswordBtn = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');
        
        if (!togglePasswordBtn || !passwordInput) return;
        
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }
};

/**
 * Employee Activity Management Module
 */
const EmployeeActivity = {
    init() {
        this.initFilters();
        this.initActivityUpdates();
    },
    
    initFilters() {
        const activityFilter = document.getElementById('activityFilter');
        if (activityFilter) {
            activityFilter.addEventListener('change', function() {
                Pagination.filterGridItems(this.value);
            });
        }
    },
    
    initActivityUpdates() {
        // Add any periodic activity updates or real-time features here
        
        // Example: Update durations every minute
        setInterval(() => {
            const timeElements = document.querySelectorAll('.duration-since');
            timeElements.forEach(el => {
                const timestamp = el.getAttribute('data-timestamp');
                if (timestamp) {
                    const startTime = new Date(timestamp);
                    const duration = Math.floor((new Date() - startTime) / (1000 * 60)); // minutes
                    el.textContent = `${duration} min`;
                }
            });
        }, 60000);
    }
};

/**
 * Pagination Module
 */
const Pagination = {
    config: {
        itemsPerPage: {
            grid: 8,
            table: 10
        },
        currentPage: {
            grid: 1,
            table: 1
        }
    },
    
    elements: {},
    
    init() {
        // Elements for grid pagination
        this.elements.gridItems = document.querySelectorAll('#employeeActivityGrid > .col');
        this.elements.gridPagination = document.getElementById('gridPagination');
        this.elements.gridPageNumbers = document.getElementById('gridPageNumbers');
        this.elements.gridPrevPage = document.getElementById('gridPrevPage');
        this.elements.gridNextPage = document.getElementById('gridNextPage');
        
        // Elements for table pagination
        this.elements.tableRows = document.querySelectorAll('#activityTableBody > tr');
        this.elements.tablePagination = document.getElementById('activityPagination');
        
        // Initialize if elements exist
        if (this.elements.gridPagination && this.elements.gridItems.length > 0) {
            this.initGridPagination();
        }
        
        if (this.elements.tablePagination && this.elements.tableRows.length > 0) {
            this.initTablePagination();
        }
    },
    
    initGridPagination() {
        this.renderGridPagination();
        this.showGridPage(1);
        
        // Handle grid page navigation
        this.elements.gridPrevPage.addEventListener('click', e => {
            e.preventDefault();
            if (this.config.currentPage.grid > 1) {
                this.showGridPage(this.config.currentPage.grid - 1);
            }
        });
        
        this.elements.gridNextPage.addEventListener('click', e => {
            e.preventDefault();
            const totalGridPages = Math.ceil(this.elements.gridItems.length / this.config.itemsPerPage.grid);
            if (this.config.currentPage.grid < totalGridPages) {
                this.showGridPage(this.config.currentPage.grid + 1);
            }
        });
    },
    
    initTablePagination() {
        // Similar implementation for table pagination
        // Would be implemented similarly to grid pagination
    },
    
    renderGridPagination() {
        const totalPages = Math.ceil(this.elements.gridItems.length / this.config.itemsPerPage.grid);
        this.elements.gridPageNumbers.innerHTML = '';
        
        for (let i = 1; i <= totalPages; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = 'page-item';
            if (i === this.config.currentPage.grid) {
                pageItem.classList.add('active');
            }
            
            const pageLink = document.createElement('a');
            pageLink.className = 'page-link';
            pageLink.href = '#';
            pageLink.textContent = i;
            pageLink.addEventListener('click', e => {
                e.preventDefault();
                this.showGridPage(i);
            });
            
            pageItem.appendChild(pageLink);
            this.elements.gridPageNumbers.appendChild(pageItem);
        }
        
        // Update prev/next buttons
        this.elements.gridPrevPage.classList.toggle('disabled', this.config.currentPage.grid === 1);
        this.elements.gridNextPage.classList.toggle('disabled', this.config.currentPage.grid === totalPages);
    },
    
    showGridPage(pageNum) {
        this.config.currentPage.grid = pageNum;
        const start = (pageNum - 1) * this.config.itemsPerPage.grid;
        const end = start + this.config.itemsPerPage.grid;
        
        // Hide all grid items
        this.elements.gridItems.forEach(item => {
            item.style.display = 'none';
        });
        
        // Show only items for current page
        for (let i = start; i < end && i < this.elements.gridItems.length; i++) {
            this.elements.gridItems[i].style.display = '';
        }
        
        // Update pagination UI
        this.renderGridPagination();
    },
    
    filterGridItems(filterValue) {
        let visibleCount = 0;
        
        this.elements.gridItems.forEach(item => {
            const status = item.getAttribute('data-status');
            if (filterValue === 'all' || status === filterValue) {
                item.classList.remove('filtered-out');
                visibleCount++;
            } else {
                item.classList.add('filtered-out');
            }
        });
        
        // Re-initialize pagination based on filtered items
        this.config.currentPage.grid = 1;
        this.renderGridPagination();
        this.showGridPage(1);
        
        return visibleCount;
    }
};

// Ensure modals are cleaned up before page navigation
window.addEventListener('beforeunload', function() {
    Utils.cleanupModals();
});

// Password toggle visibility
document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        this.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        passwordInput.type = 'password';
        this.innerHTML = '<i class="fas fa-eye"></i>';
    }
});

// Password generator
document.getElementById('generatePassword').addEventListener('click', function() {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    document.getElementById('password').value = password;
    document.getElementById('password').type = 'text';
    document.getElementById('togglePassword').innerHTML = '<i class="fas fa-eye-slash"></i>';
});

// Edit user modal functionality
document.querySelectorAll('.edit-user').forEach(button => {
    button.addEventListener('click', function() {
        // Use data attributes instead of API call
        const userId = this.dataset.userId;
        const username = this.dataset.username;
        const name = this.dataset.name;
        const email = this.dataset.email;
        const role = this.dataset.role;
        const active = this.dataset.active;
        
        // Populate the form
        document.getElementById('editUserId').value = userId;
        document.getElementById('editUsername').value = username;
        document.getElementById('editFullName').value = name;
        document.getElementById('editEmail').value = email;
        document.getElementById('editRole').value = role;
        document.getElementById('editStatus').value = active;
        
        // Show the modal
        const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
        editUserModal.show();
    });
});

// Also fix the delete user functionality
document.getElementById('confirmDelete').addEventListener('click', function() {
    const userId = document.getElementById('deleteUserId').value;
    
    // Use the correct API endpoint based on your add user form
    fetch(`/admin/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            // Close modal and refresh table
            const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteUserModal'));
            deleteModal.hide();
            
            // Remove the row from the table
            document.querySelector(`tr[data-user-id="${userId}"]`).remove();
            
            // Show success message using your Utils function if available
            if (typeof Utils !== 'undefined' && Utils.showAlert) {
                Utils.showAlert('User deleted successfully', 'success');
            } else {
                alert('User deleted successfully');
            }
        } else {
            throw new Error('Failed to delete user');
        }
    })
    .catch(error => {
        console.error('Error deleting user:', error);
        if (typeof Utils !== 'undefined' && Utils.showAlert) {
            Utils.showAlert('Failed to delete user', 'danger');
        } else {
            alert('Failed to delete user');
        }
    });
});

// Add functionality for edit form submission
document.getElementById('editUserForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const userId = document.getElementById('editUserId').value;
    const userData = {
        username: document.getElementById('editUsername').value,
        name: document.getElementById('editFullName').value,
        email: document.getElementById('editEmail').value,
        role: document.getElementById('editRole').value,
        active: document.getElementById('editStatus').value === 'active'
    };
    
    // Check if password reset is requested
    if (document.getElementById('resetPassword').checked) {
        userData.password = document.getElementById('newPassword').value;
    }
    
    // Use the correct API endpoint
    fetch(`/admin/api/users/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => {
        if (response.ok) {
            // Close modal
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
            editModal.hide();
            
            // Show success message
            if (typeof Utils !== 'undefined' && Utils.showAlert) {
                Utils.showAlert('User updated successfully', 'success');
            } else {
                alert('User updated successfully');
            }
            
            // Reload page to refresh data
            setTimeout(() => window.location.reload(), 1000);
        } else {
            throw new Error('Failed to update user');
        }
    })
    .catch(error => {
        console.error('Error updating user:', error);
        if (typeof Utils !== 'undefined' && Utils.showAlert) {
            Utils.showAlert('Failed to update user', 'danger');
        } else {
            alert('Failed to update user');
        }
    });
});

// Toggle visibility of edit password field
document.getElementById('toggleEditPassword')?.addEventListener('click', function() {
    const passwordInput = document.getElementById('newPassword');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        this.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        passwordInput.type = 'password';
        this.innerHTML = '<i class="fas fa-eye"></i>';
    }
});

// Reset password toggle in edit user form
document.getElementById('resetPassword').addEventListener('change', function() {
    const passwordFields = document.querySelector('.password-reset-fields');
    if (this.checked) {
        passwordFields.style.display = 'block';
    } else {
        passwordFields.style.display = 'none';
    }
});

// Delete user confirmation
document.querySelectorAll('.delete-user').forEach(button => {
    button.addEventListener('click', function() {
        const userId = this.dataset.userId;
        const userName = this.dataset.userName;
        
        document.getElementById('deleteUserId').value = userId;
        document.getElementById('deleteUserName').textContent = userName;
        
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteUserModal'));
        deleteModal.show();
    });
});

// Confirm user deletion
document.getElementById('confirmDelete').addEventListener('click', function() {
    const userId = document.getElementById('deleteUserId').value;
    
    fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            // Close modal and refresh table
            const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteUserModal'));
            deleteModal.hide();
            
            // Remove the row from the table
            document.querySelector(`tr[data-user-id="${userId}"]`).remove();
            
            // Show success message
            alert('User deleted successfully');
        } else {
            throw new Error('Failed to delete user');
        }
    })
    .catch(error => {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
    });
});

// Bulk selection handling
document.getElementById('selectAllUsers').addEventListener('change', function() {
    const isChecked = this.checked;
    document.querySelectorAll('.user-select').forEach(checkbox => {
        checkbox.checked = isChecked;
    });
    
    // Enable/disable bulk actions button
    document.getElementById('bulkActionDropdown').querySelector('button').disabled = !isChecked;
});

// Individual checkbox selection handling
document.querySelectorAll('.user-select').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        const anyChecked = Array.from(document.querySelectorAll('.user-select')).some(cb => cb.checked);
        document.getElementById('bulkActionDropdown').querySelector('button').disabled = !anyChecked;
        
        // Update "select all" checkbox
        const allChecked = Array.from(document.querySelectorAll('.user-select')).every(cb => cb.checked);
        document.getElementById('selectAllUsers').checked = allChecked;
    });
});

// Export users to CSV
document.getElementById('exportUsersCsv').addEventListener('click', function() {
    // Get all visible users from the table
    const users = [];
    document.querySelectorAll('#usersTable tbody tr').forEach(row => {
        if (row.style.display !== 'none') {
            const cells = row.querySelectorAll('td');
            if (cells.length > 1) { // Skip message rows
                users.push({
                    username: cells[1].textContent,
                    name: cells[2].textContent,
                    email: cells[3].textContent,
                    role: cells[4].textContent.trim(),
                    department: cells[5].textContent,
                    status: cells[6].textContent.trim(),
                    lastLogin: cells[7].textContent
                });
            }
        }
    });
    
    if (users.length === 0) {
        alert('No users to export');
        return;
    }
    
    // Create CSV content
    const headers = ['Username', 'Full Name', 'Email', 'Role', 'Department', 'Status', 'Last Login'];
    let csvContent = headers.join(',') + '\n';
    
    users.forEach(user => {
        const row = [
            `"${user.username}"`,
            `"${user.name}"`,
            `"${user.email}"`,
            `"${user.role}"`,
            `"${user.department}"`,
            `"${user.status}"`,
            `"${user.lastLogin}"`
        ];
        csvContent += row.join(',') + '\n';
    });
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// User search functionality
document.getElementById('userSearchInput').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    document.querySelectorAll('#usersTable tbody tr').forEach(row => {
        const username = row.cells[1]?.textContent.toLowerCase() || '';
        const name = row.cells[2]?.textContent.toLowerCase() || '';
        const email = row.cells[3]?.textContent.toLowerCase() || '';
        
        if (username.includes(searchTerm) || name.includes(searchTerm) || email.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

// User role and status filters
document.getElementById('userRoleFilter').addEventListener('change', filterUsers);
document.getElementById('userStatusFilter').addEventListener('change', filterUsers);

function filterUsers() {
    const roleFilter = document.getElementById('userRoleFilter').value;
    const statusFilter = document.getElementById('userStatusFilter').value;
    
    document.querySelectorAll('#usersTable tbody tr').forEach(row => {
        const userRole = row.dataset.role;
        const userStatus = row.dataset.status;
        
        const roleMatch = roleFilter === 'all' || userRole === roleFilter;
        const statusMatch = statusFilter === 'all' || userStatus === statusFilter;
        
        if (roleMatch && statusMatch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Add this function to your existing code or modify the modal initialization

// Function to fix modal scrolling issues
function fixModalScrolling(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Fix scrolling when modal opens
    modal.addEventListener('shown.bs.modal', function() {
        // Make sure the modal body has scrolling capability
        const modalBody = this.querySelector('.modal-body');
        if (modalBody) {
            modalBody.style.maxHeight = 'calc(100vh - 200px)';
            modalBody.style.overflowY = 'auto';
        }
        
        // Ensure body keeps the modal-open class (sometimes it gets removed)
        document.body.classList.add('modal-open');
    });
    
    // Fix backdrop issues on close
    modal.addEventListener('hidden.bs.modal', function() {
        // Small delay to let Bootstrap's built-in handlers run first
        setTimeout(() => {
            // Remove leftover backdrop if any
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            
            // Only remove modal-open class if no other modals are visible
            const visibleModals = document.querySelectorAll('.modal.show');
            if (visibleModals.length === 0) {
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }
        }, 50);
    });
}

// Apply this fix to your modals
document.addEventListener('DOMContentLoaded', function() {
    fixModalScrolling('addUserModal');
    fixModalScrolling('editUserModal');
    fixModalScrolling('deleteUserModal');
    
    // Add CSS for better modal sizing
    const style = document.createElement('style');
    style.textContent = `
        .modal-dialog {
            max-height: 90vh;
            display: flex;
            flex-direction: column;
        }
        .modal-content {
            max-height: 90vh;
            display: flex;
            flex-direction: column;
        }
        .modal-body {
            overflow-y: auto;
        }
    `;
    document.head.appendChild(style);
});

