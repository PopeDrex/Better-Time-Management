const express = require('express');
const router = express.Router();
const Leave = require('../model/Leave');
const EmployeeController = require('../controllers/employeeController');
const Employee = require('../model/Employee');
const Timesheet = require('../model/TimeEntry');
const verifyJWT = require('../middleware/verifyJWT');

// Create controller instance
const employeeController = new EmployeeController(Employee, Timesheet);

// Apply JWT verification to all routes
router.use(verifyJWT);

// Employee routes
router.get('/', (req, res) => employeeController.getAllEmployees(req, res));
router.get('/:id', (req, res) => employeeController.getEmployeeById(req, res));
router.post('/', (req, res) => employeeController.createEmployee(req, res));
router.put('/:id', (req, res) => employeeController.updateEmployee(req, res));
router.delete('/:id', (req, res) => employeeController.deleteEmployee(req, res));

// Employee timesheet routes
router.get('/:id/timesheets', (req, res) => employeeController.getEmployeeTimesheets(req, res));
router.post('/timesheets', (req, res) => employeeController.submitTimesheet(req, res));

// Leave routes
router.get('/apply-leave', async (req, res) => {
    try {
        const employeeId = req.session.user.id;
        const leaveData = await Leave.getLeaveSummary(employeeId);
        
        res.render('apply-leave', { 
            activePage: 'apply-leave',
            leaveData
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', { 
            message: 'Error loading leave data', 
            error 
        });
    }
});

router.post('/submit-leave', async (req, res) => {
    try {
        const { startDate, endDate, leaveType, reason, days } = req.body;
        const employeeId = req.session.user.id;
        
        // Create the leave request
        await Leave.create({
            employeeId,
            leaveType,
            startDate,
            endDate,
            reason,
            days: parseInt(days) || calculateBusinessDays(startDate, endDate)
        });
        
        res.redirect('/apply-leave?success=Your leave request has been submitted successfully');
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/apply-leave?error=Failed to submit leave request');
    }
});

router.post('/cancel-leave/:id', async (req, res) => {
    try {
        const leaveId = req.params.id;
        const employeeId = req.session.user.id;
        
        // Verify this leave belongs to the employee
        const leave = await Leave.getById(leaveId);
        
        if (!leave || leave.employee_id !== employeeId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        
        if (leave.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending leaves can be canceled' });
        }
        
        await Leave.cancel(leaveId);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;