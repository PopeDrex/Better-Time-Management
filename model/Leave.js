const db = require('../config/sqliteConn');

class Leave {
    // Create a new leave request
    static async create(leaveData) {
        const { employee_id, leave_type, start_date, end_date, reason, status = 'pending' } = leaveData;
        
        try {
            const result = await db.run(
                `INSERT INTO leaves (employee_id, start_date, end_date, leave_type, reason, status)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [employee_id, start_date, end_date, leave_type, reason, status]
            );
            return { id: result.lastID, ...leaveData };
        } catch (error) {
            throw error;
        }
    }

    // Get a leave request by ID
    static async findById(id) {
        try {
            return await db.get(
                `SELECT * FROM leaves WHERE id = ?`,
                [id]
            );
        } catch (error) {
            throw error;
        }
    }

    // Get all leave requests (with optional filtering)
    static async findAll(filters = {}) {
        try {
            let query = `SELECT * FROM leaves`;
            const params = [];
            const conditions = [];

            if (filters.employee_id) {
                conditions.push(`employee_id = ?`);
                params.push(filters.employee_id);
            }
            
            if (filters.status) {
                conditions.push(`status = ?`);
                params.push(filters.status);
            }

            if (conditions.length) {
                query += ` WHERE ${conditions.join(' AND ')}`;
            }

            return await db.all(query, params);
        } catch (error) {
            throw error;
        }
    }

    // Update a leave request
    static async update(id, updateData) {
        try {
            const fields = Object.keys(updateData)
                .map(key => `${key} = ?`)
                .join(', ');
            
            const values = [...Object.values(updateData), id];
            
            const result = await db.run(
                `UPDATE leaves SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                values
            );
            
            return result.changes > 0;
        } catch (error) {
            throw error;
        }
    }

    // Delete a leave request
    static async delete(id) {
        try {
            const result = await db.run(
                `DELETE FROM leaves WHERE id = ?`,
                [id]
            );
            return result.changes > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Leave;