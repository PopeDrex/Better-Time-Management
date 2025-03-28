const db = require('../config/sqliteConn');

class Employee {
  /**
   * Create a new employee
   * @param {Object} employeeData - Employee information
   * @returns {Promise<Object>} - Newly created employee with ID
   */
  static async create(employeeData) {
    const { name, email, position, department, hireDate } = employeeData;
    
    try {
      const result = await db.run(
        `INSERT INTO employees (name, email, position, department, hire_date) 
         VALUES (?, ?, ?, ?, ?)`,
        [name, email, position, department, hireDate]
      );
      
      return {
        id: result.lastID,
        name,
        email,
        position,
        department,
        hireDate
      };
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  /**
   * Get employee by ID
   * @param {number} id - Employee ID
   * @returns {Promise<Object>} - Employee data
   */
  static async getById(id) {
    try {
      return await db.get('SELECT * FROM employees WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error getting employee:', error);
      throw error;
    }
  }
  
  /**
   * Get all employees
   * @returns {Promise<Array>} - Array of employees
   */
  static async getAll() {
    try {
      return await db.all('SELECT * FROM employees');
    } catch (error) {
      console.error('Error getting all employees:', error);
      throw error;
    }
  }
  
  /**
   * Get employee by user ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Employee data
   */
  static async getByUserId(userId) {
    try {
      return await db.get('SELECT * FROM employees WHERE user_id = ?', [userId]);
    } catch (error) {
      console.error('Error getting employee by user ID:', error);
      throw error;
    }
  }

  /**
   * Update employee information
   * @param {number} id - Employee ID
   * @param {Object} employeeData - Updated employee data
   * @returns {Promise<boolean>} - Success status
   */
  static async update(id, employeeData) {
    const { name, email, position, department, hireDate } = employeeData;
    
    try {
      await db.run(
        `UPDATE employees SET 
         name = ?, 
         email = ?, 
         position = ?, 
         department = ?, 
         hire_date = ? 
         WHERE id = ?`,
        [name, email, position, department, hireDate, id]
      );
      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  /**
   * Get employee timesheets
   * @param {number} employeeId - Employee ID
   * @returns {Promise<Array>} - Array of timesheets
   */
  static async getTimesheets(employeeId) {
    try {
      return await db.all('SELECT * FROM timesheets WHERE employee_id = ?', [employeeId]);
    } catch (error) {
      console.error('Error getting employee timesheets:', error);
      throw error;
    }
  }

  /**
   * Get employee leave requests
   * @param {number} employeeId - Employee ID
   * @returns {Promise<Array>} - Array of leave requests
   */
  static async getLeaveRequests(employeeId) {
    try {
      return await db.all('SELECT * FROM leaves WHERE employee_id = ?', [employeeId]);
    } catch (error) {
      console.error('Error getting employee leaves:', error);
      throw error;
    }
  }
}

module.exports = Employee;