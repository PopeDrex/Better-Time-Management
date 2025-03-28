const express = require('express');
const router = express.Router();
const db = require('../config/sqliteConn');
const bcrypt = require('bcrypt');

// Storage for real-time user time entries
let userTimeEntries = {};

/**
 * Set user time entries from server.js
 * @param {Object} entries - User time entries
 */
function setUserTimeEntries(entries) {
    userTimeEntries = entries;
}

/**
 * Admin middleware - verify user has admin role
 */
const checkAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).render('error', {
            message: 'Access denied. Admin privileges required.',
            activePage: 'error'
        });
    }
    next();
};

/**
 * Get timesheet data for all employees
 * @returns {Array} Array of timesheet entries
 */
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

/**
 * Get employee activity status
 * @returns {Array} Array of employee activity data
 */
async function getEmployeeActivityData() {
    try {
        // Get all active employees
        const employees = await db.all(`
            SELECT id, name, username, email 
            FROM users 
            WHERE role = 'employee' AND active = 1
        `);
        
        // Get today's approved leaves
        const today = new Date().toISOString().split('T')[0];
        const approvedLeaves = await db.all(`
            SELECT employee_id as employeeId
            FROM leaves
            WHERE status = 'approved' 
            AND ? BETWEEN start_date AND end_date
        `, [today]);
        
        // Generate employee activity data
        const activityData = [];
        
        for (const employee of employees) {
            // Check if employee has an approved leave for today
            const onLeave = approvedLeaves.some(leave => 
                leave.employeeId === employee.id
            );
            
            // Get employee's time entry data
            const userId = employee.id.toString();
            const userEntry = userTimeEntries[userId] || { activeEntry: null };
            
            // Determine employee status
            let status = 'not-checked-in';
            let breakStatus = 'none';
            let checkInTime = null;
            
            if (userEntry.activeEntry) {
                status = 'checked-in';
                checkInTime = userEntry.activeEntry.login;
                
                if (userEntry.activeEntry.pauseStart) {
                    breakStatus = 'on-break';
                } else if (userEntry.activeEntry.unavailableStart) {
                    breakStatus = 'unavailable';
                }
            }
            
            activityData.push({
                id: employee.id,
                name: employee.name,
                email: employee.email,
                status: status,
                breakStatus: breakStatus,
                checkInTime: checkInTime,
                onLeave: onLeave,
                missing: !onLeave && status === 'not-checked-in'
            });
        }
        
        return activityData;
    } catch (error) {
        console.error('Error generating employee activity data:', error);
        return [];
    }
}

/**
 * API endpoint for timesheet data
 */
router.get('/timesheets', checkAdmin, async (req, res) => {
    try {
        const timesheets = await getTimesheetData();
        res.json(timesheets);
    } catch (error) {
        console.error('Error fetching timesheets:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * API endpoint for employee activity
 */
router.get('/api/employee-activity', checkAdmin, async (req, res) => {
    try {
        const activityData = await getEmployeeActivityData();
        res.json(activityData);
    } catch (error) {
        console.error('Error fetching employee activity:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Root admin route - Dashboard
 */
router.get('/', checkAdmin, async (req, res) => {
    try {
        // Fetch users for the user management section
        const users = await db.all('SELECT id, username, name, role, active FROM users');
        
        // Get timesheet data
        const timesheets = await getTimesheetData();
        
        // Get employee activity data
        const employeeActivity = await getEmployeeActivityData();
        
        res.render('admin', { 
            title: 'Admin Dashboard',
            users,
            timesheets,
            employeeActivity,
            activePage: 'admin'
        });
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        res.status(500).render('error', {
            message: 'Error loading admin dashboard',
            activePage: 'error'
        });
    }
});

    /**
     * Create new user API endpoint
     */
    router.post('/api/users', checkAdmin, async (req, res) => {
        try {
            const { username, fullName, email, role, password } = req.body;
        
        // Validate required fields
        if (!username || !fullName || !email || !role || !password) {
            return res.status(400).json({ 
                error: true, 
                message: 'All fields are required' 
            });
        }
        
        // First check if the email already exists
        const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(409).json({ 
                error: true,
                message: 'Email address already in use. Please use a different email.'
            });
        }
        
        // Check if username is taken
        const existingUsername = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUsername) {
            return res.status(409).json({ 
                error: true,
                message: 'Username already in use. Please choose another username.'
            });
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create the user
        await db.run(
            'INSERT INTO users (username, name, email, role, password, active) VALUES (?, ?, ?, ?, ?, ?)',
            [username, fullName, email, role, hashedPassword, 1]
        );
        
        res.status(201).json({ success: true, message: 'User created successfully' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: true, message: 'Failed to create user' });
    }
});

/**
 * Delete user API endpoint
 */
router.delete('/api/users/:id', checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Make sure ID is a number
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        // Don't allow deleting your own account
        if (req.session.user && req.session.user.id === parseInt(id)) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }
        
        // Check if user exists
        const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        await db.run('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Export the router and setter function
module.exports = router;
module.exports.setUserTimeEntries = setUserTimeEntries;