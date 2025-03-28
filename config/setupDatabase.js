const db = require('./sqliteConn');

async function setupDatabase() {
  try {
    // Create employees table
    await db.run(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        leave_quota INTEGER DEFAULT 25,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create leave_requests table
    await db.run(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER,
        start_date TEXT,
        end_date TEXT,
        days INTEGER,
        leave_type TEXT,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id)
      )
    `);

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup error:', error);
  }
}

// Add to setupDatabase.js
async function createDefaultEmployeeRecords() {
    try {
      // Get all users
      const users = await db.all('SELECT id FROM users');
      
      // For each user, create an employee record if not exists
      for (const user of users) {
        const exists = await db.get('SELECT id FROM employees WHERE user_id = ?', [user.id]);
        if (!exists) {
          await db.run('INSERT INTO employees (user_id, leave_quota) VALUES (?, ?)', 
            [user.id, 25]);
        }
      }
      
      console.log('Default employee records created');
    } catch (error) {
      console.error('Error creating employee records:', error);
    }
  }

setupDatabase();

createDefaultEmployeeRecords();