const Employee = require('../model/Employee');
const Timesheet = require('../model/Timesheet');

class EmployeeController {
    constructor(employeeModel, timesheetModel) {
        this.employeeModel = employeeModel;
        this.timesheetModel = timesheetModel;
    }
    
    // Get all employees
    async getAllEmployees(req, res) {
        try {
            const employees = await this.employeeModel.findAll();
            res.json(employees);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving employees', error: error.message });
        }
    }
    
    // Get employee by ID
    async getEmployeeById(req, res) {
        try {
            const employee = await this.employeeModel.findById(req.params.id);
            if (!employee) {
                return res.status(404).json({ message: 'Employee not found' });
            }
            res.json(employee);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving employee', error: error.message });
        }
    }
    
    // Create new employee
    async createEmployee(req, res) {
        try {
            const newEmployee = await this.employeeModel.create(req.body);
            res.status(201).json(newEmployee);
        } catch (error) {
            res.status(500).json({ message: 'Error creating employee', error: error.message });
        }
    }
    
    // Update employee
    async updateEmployee(req, res) {
        try {
            const updated = await this.employeeModel.update(req.params.id, req.body);
            if (!updated) {
                return res.status(404).json({ message: 'Employee not found' });
            }
            res.json({ message: 'Employee updated successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error updating employee', error: error.message });
        }
    }
    
    // Delete employee
    async deleteEmployee(req, res) {
        try {
            const deleted = await this.employeeModel.delete(req.params.id);
            if (!deleted) {
                return res.status(404).json({ message: 'Employee not found' });
            }
            res.json({ message: 'Employee deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting employee', error: error.message });
        }
    }
    
    // Get employee timesheets
    async getEmployeeTimesheets(req, res) {
        try {
            const timesheets = await this.timesheetModel.findByEmployeeId(req.params.id);
            res.json(timesheets);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving timesheets', error: error.message });
        }
    }
    
    // Submit timesheet
    async submitTimesheet(req, res) {
        try {
            const { employeeId, weekEnding, entries } = req.body;
            
            // Validate input
            if (!employeeId || !weekEnding || !entries) {
                return res.status(400).json({ message: 'Missing required fields' });
            }
            
            const timesheet = await this.timesheetModel.create({
                employeeId,
                weekEnding,
                entries,
                status: 'pending'
            });
            
            res.status(201).json(timesheet);
        } catch (error) {
            res.status(500).json({ message: 'Error submitting timesheet', error: error.message });
        }
    }
}

module.exports = EmployeeController;