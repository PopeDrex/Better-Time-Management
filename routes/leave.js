const express = require('express');
const router = express.Router();
const Leave = require('../model/Leave');

// Get all leaves (admin only)
router.get('/', (req, res, next) => {
  req.checkAdmin(req, res, next);
}, async (req, res) => {
  try {
    const leaves = await Leave.getAll();
    res.json(leaves);
  } catch (error) {
    console.error('Error fetching all leaves:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leave data for current user
router.get('/my-leaves', async (req, res) => {
  try {
    const employeeId = req.session.user.id;
    const leaves = await Leave.getByEmployeeId(employeeId);
    res.json(leaves);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply for leave
router.post('/apply', async (req, res) => {
  try {
    const { startDate, endDate, leaveType, reason } = req.body;
    const employeeId = req.session.user.id;
    
    const result = await Leave.create({
      employeeId,
      startDate,
      endDate,
      leaveType,
      reason
    });
    
    res.status(201).json({ message: 'Leave request submitted successfully', id: result.id });
  } catch (error) {
    console.error('Error applying for leave:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel leave request
router.post('/cancel/:id', async (req, res) => {
  try {
    const leaveId = req.params.id;
    const employeeId = req.session.user.id;
    
    // Verify this leave belongs to the current user
    const leave = await Leave.getById(leaveId);
    if (!leave || leave.employeeId !== employeeId) {
      return res.status(403).json({ message: 'Not authorized to cancel this leave request' });
    }
    
    await Leave.cancel(leaveId);
    res.json({ success: true, message: 'Leave request cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling leave:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/Reject leave (admin only)
router.post('/:id/status', (req, res, next) => {
  req.checkAdmin(req, res, next);
}, async (req, res) => {
  try {
    const { status } = req.body;
    const leaveId = req.params.id;
    const reviewerId = req.session.user.id;
    
    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    await Leave.updateStatus(leaveId, status, reviewerId);
    res.json({ success: true, message: `Leave request ${status} successfully` });
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;