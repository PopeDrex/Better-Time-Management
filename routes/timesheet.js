const express = require('express');
const router = express.Router();
const TimesheetController = require('../controllers/timesheetController');
const Timesheet = require('../model/TimeEntry');
const verifyJWT = require('../middleware/verifyJWT');
const verifyRoles = require('../middleware/verifyRoles');

// Create controller instance
const timesheetController = new TimesheetController(Timesheet);

// Apply JWT verification to all routes
router.use(verifyJWT);

// Timesheet routes
router.get('/', verifyRoles('admin', 'manager'), (req, res) => timesheetController.getAllTimesheets(req, res));
router.get('/:id', (req, res) => timesheetController.getTimesheetById(req, res));
router.put('/:id', (req, res) => timesheetController.updateTimesheet(req, res));
router.post('/:id/approve', verifyRoles('admin', 'manager'), (req, res) => timesheetController.approveTimesheet(req, res));
router.post('/:id/reject', verifyRoles('admin', 'manager'), (req, res) => timesheetController.rejectTimesheet(req, res));

module.exports = router;