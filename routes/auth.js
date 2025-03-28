const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/sqliteConn');

// GET login page
router.get('/login', (req, res) => {
    res.render('login', { 
        title: 'Login',
        error: req.query.error,
        success: req.query.success,
        return: req.query.return,
    });
});

// POST login form submission
router.post('/login', async (req, res) => {
    try {
        const { username, password, remember } = req.body;
        
        console.log(`Login attempt for user: ${username}`);
        
        // Validate input
        if (!username || !password) {
            return res.render('login', { 
                error: 'Username and password are required',
                title: 'Login'
            });
        }
        
        // Find user in database
        const user = await db.get(
            'SELECT id, username, name, password, role, active FROM users WHERE username = ?',
            [username]
        );
        
        console.log(`User found:`, user ? `ID: ${user.id}, Role: ${user.role}` : 'No user found');
        
        // Check if user exists and is active
        if (!user) {
            return res.render('login', { 
                error: 'Invalid username or password',
                title: 'Login'
            });
        }
        
        if (user.active !== 1) {
            return res.render('login', { 
                error: 'Your account has been deactivated. Please contact an administrator.',
                title: 'Login'
            });
        }
        
        // Compare password with bcrypt
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            console.log(`Password mismatch for user: ${username}`);
            return res.render('login', { 
                error: 'Invalid username or password',
                title: 'Login'
            });
        }
        
        // Set session
        req.session.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role
        };
        
        // Set remember me cookie
        if (remember) {
            // Set session to last longer (30 days)
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
        }
        
        // Update last login time
        await db.run(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );
        
        console.log(`User ${username} logged in successfully`);

        // check if return requestQuery is not null, and redirect to that page
        console.log("test if req.return is null");
        console.log(req.query.return);
        if (req.query.return)
        {
            return res.redirect(req.query.return);
        }
        // Redirect based on role
        if (user.role === 'admin') {
            return res.redirect('/admin');
        } else {
            return res.redirect('/dashboard');
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.render('login', { 
            error: 'An error occurred during login. Please try again.',
            title: 'Login'
        });
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login?success=You have been logged out successfully');
    });
});

// Add this route for testing purposes only - remove in production

router.get('/create-test-user', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        await db.run(
            'INSERT INTO users (username, name, password, role, active) VALUES (?, ?, ?, ?, ?)',
            ['testuser', 'Test User', hashedPassword, 'user', 1]
        );
        
        res.send('Test user created successfully');
    } catch (error) {
        console.error('Error creating test user:', error);
        res.status(500).send('Error creating test user');
    }
});

// DO NOT ADD ANY MORE ROUTES HERE WITHOUT PROPER HANDLERS

module.exports = router;