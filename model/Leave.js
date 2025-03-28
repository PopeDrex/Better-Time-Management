const db = require('../config/sqliteConn');

class Leave {
    // Create leave request
    static async create(leaveData) {
        const { employeeId, leaveType, startDate, endDate, reason, days } = leaveData;
        try {
            const result = await db.run(
                `INSERT INTO leaves 
                (employee_id, leave_type, start_date, end_date, reason, days, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [employeeId, leaveType, startDate, endDate, reason, days, 'pending']
            );
            return { id: result.lastID, ...leaveData, status: 'pending' };
        } catch (error) {
            console.error('Error creating leave request:', error);
            throw error;
        }
    }

    // Get leave requests by employee ID
    static async getByEmployeeId(employeeId) {
        try {
            return await db.all(
                `SELECT * FROM leaves WHERE employee_id = ? ORDER BY created_at DESC`,
                [employeeId]
            );
        } catch (error) {
            console.error('Error fetching leave requests:', error);
            throw error;
        }
    }

    // Get leave request by ID
    static async getById(id) {
        try {
            return await db.get(`SELECT * FROM leaves WHERE id = ?`, [id]);
        } catch (error) {
            console.error('Error fetching leave request:', error);
            throw error;
        }
    }

    // Update leave request status
    static async updateStatus(id, status, reviewedBy = null) {
        try {
            await db.run(
                `UPDATE leaves SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [status, reviewedBy, id]
            );
            return true;
        } catch (error) {
            console.error('Error updating leave status:', error);
            throw error;
        }
    }

    // Cancel leave request
    static async cancel(id) {
        try {
            await db.run(`DELETE FROM leaves WHERE id = ? AND status = 'pending'`, [id]);
            return true;
        } catch (error) {
            console.error('Error canceling leave request:', error);
            throw error;
        }
    }

    // Get leave summary for an employee
    static async getLeaveSummary(employeeId) {
        try {
            // Get total leave quota (this would come from employee settings or a separate table)
            const employee = await db.get(
                `SELECT leave_quota FROM employees WHERE id = ?`,
                [employeeId]
            );
            
            const totalQuota = employee ? employee.leave_quota : 20; // Default quota
            
            // Get used leaves (only count approved leaves)
            const result = await db.get(
                `SELECT SUM(days) as used_leaves FROM leaves 
                WHERE employee_id = ? AND status = 'approved' 
                AND start_date >= datetime('now', 'start of year')`,
                [employeeId]
            );
            
            const usedLeaves = result.used_leaves || 0;
            
            // Get all leave requests for the current year
            const requests = await db.all(
                `SELECT * FROM leaves 
                WHERE employee_id = ? 
                AND start_date >= datetime('now', 'start of year')
                ORDER BY start_date DESC`,
                [employeeId]
            );
            
            return {
                totalQuota,
                usedLeaves,
                requests
            };
        } catch (error) {
            console.error('Error getting leave summary:', error);
            throw error;
        }
    }
}

// Ensure the leaves table exists
db.run(`
    CREATE TABLE IF NOT EXISTS leaves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        leave_type TEXT NOT NULL CHECK(leave_type IN ('annual', 'sick', 'personal', 'unpaid')),
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        reason TEXT NOT NULL,
        days INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
        reviewed_by INTEGER,
        reviewed_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`).catch(err => console.error('Error creating leaves table:', err));

module.exports = Leave;