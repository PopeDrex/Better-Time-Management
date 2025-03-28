class TimesheetController {
    constructor(timesheetModel) {
        this.timesheetModel = timesheetModel;
    }
    
    // Get all timesheets
    async getAllTimesheets(req, res) {
        try {
            const timesheets = await this.timesheetModel.findAll();
            res.json(timesheets);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving timesheets', error: error.message });
        }
    }
    
    // Get timesheet by ID
    async getTimesheetById(req, res) {
        try {
            const timesheet = await this.timesheetModel.findById(req.params.id);
            if (!timesheet) {
                return res.status(404).json({ message: 'Timesheet not found' });
            }
            res.json(timesheet);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving timesheet', error: error.message });
        }
    }
    
    // Update timesheet
    async updateTimesheet(req, res) {
        try {
            const updated = await this.timesheetModel.update(req.params.id, req.body);
            if (!updated) {
                return res.status(404).json({ message: 'Timesheet not found' });
            }
            res.json({ message: 'Timesheet updated successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error updating timesheet', error: error.message });
        }
    }
    
    // Approve timesheet
    async approveTimesheet(req, res) {
        try {
            const timesheet = await this.timesheetModel.findById(req.params.id);
            if (!timesheet) {
                return res.status(404).json({ message: 'Timesheet not found' });
            }
            
            timesheet.status = 'approved';
            timesheet.approvedBy = req.user.id;
            timesheet.approvedAt = new Date();
            
            await this.timesheetModel.update(req.params.id, timesheet);
            
            res.json({ message: 'Timesheet approved successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error approving timesheet', error: error.message });
        }
    }
    
    // Reject timesheet
    async rejectTimesheet(req, res) {
        try {
            const { reason } = req.body;
            if (!reason) {
                return res.status(400).json({ message: 'Rejection reason is required' });
            }
            
            const timesheet = await this.timesheetModel.findById(req.params.id);
            if (!timesheet) {
                return res.status(404).json({ message: 'Timesheet not found' });
            }
            
            timesheet.status = 'rejected';
            timesheet.rejectedBy = req.user.id;
            timesheet.rejectedAt = new Date();
            timesheet.rejectionReason = reason;
            
            await this.timesheetModel.update(req.params.id, timesheet);
            
            res.json({ message: 'Timesheet rejected successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error rejecting timesheet', error: error.message });
        }
    }
}

module.exports = TimesheetController;