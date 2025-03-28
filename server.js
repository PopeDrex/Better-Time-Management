// Environment and core dependencies
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const db = require('./config/sqliteConn');
const bodyParser = require('body-parser');
const path = require('path'); 
const ejs = require('ejs');
const expressLayouts = require('express-ejs-layouts');


// Import models
const Leave = require('./model/Leave'); // Add this line to import the Leave model

// Import routes
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employee'); 
const timesheetRoutes = require('./routes/timesheet');
const leaveRoutes = require('./routes/leave');

// Initialize application
const app = express();
const PORT = process.env.PORT || 3001;

// Parse JSON body
app.use(express.json());
// Parse URL-encoded form bodies
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// CONFIGURATION
// ============================================================================

// View engine setup
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));  // Use 'views' (plural)
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'timemanagementappsecret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day default
  }
}));

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format time in HH:MM format
 * @param {Date} date - Date object
 * @returns {string} Formatted time string (HH:MM)
 */
const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Calculate time difference in minutes
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {number} Difference in minutes
 */
const calculateTimeDiff = (startTime, endTime) => {
  const start = new Date(`2025-03-21T${startTime}`);
  const end = new Date(`2025-03-21T${endTime}`);
  return Math.round((end - start) / (1000 * 60));
};

/**
 * Format minutes as HH:MM
 * @param {number} minutes - Total minutes
 * @returns {string} Formatted time string (HH:MM)
 */
const formatMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
};

// ============================================================================
// DATABASE MOCKS
// ============================================================================

// Replace the current timeEntries object with this user-based structure
const userTimeEntries = {};

// Share userTimeEntries with the admin routes
if (adminRoutes.setUserTimeEntries) {
  adminRoutes.setUserTimeEntries(userTimeEntries);
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Authentication middleware
app.use((req, res, next) => {
  // Make authentication status available to all views
  res.locals.isAuthenticated = !!req.session.user; // Changed from req.session.isAuthenticated
  res.locals.user = req.session.user || null;
  next();
});

// Middleware to check if user is logged in
const checkAuth = (req, res, next) => {
  if (!req.session.user) { // Changed from req.session.isAuthenticated
    return res.redirect('/login?error=Please log in to access this page');
  }
  next();
};

// Admin authorization middleware
const checkAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('error', { 
      message: 'Access denied. Admin privileges required.',
      activePage: 'error'
    });
  }
  next();
};

// Make the middleware available to the routes
app.use((req, res, next) => {
  req.checkAdmin = checkAdmin;
  req.checkAuth = checkAuth;
  next();
});

// Register routes
app.use('/api/auth', authRoutes); // For API authentication (JWT tokens)
app.use('/api/employees', employeeRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/leaves', leaveRoutes); // Change from '/' to '/api/leaves'

// Login and registration page routes only, not all auth routes
app.get('/login', (req, res) => {
  res.render('login', { activePage: 'login', error: req.query.error });
});

app.get('/register', (req, res) => {
  res.render('register', { activePage: 'register' });
});

// Login form submission handler
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const returnUrl = req.body.returnUrl || '/dashboard';
    
    // Find user in database
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    
    // Check if user exists and password matches
    if (!user) {
      return res.render('login', { 
        activePage: 'login', 
        error: 'Invalid username or password' 
      });
    }
    
    // Verify password using bcrypt
    const bcrypt = require('bcrypt');
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.render('login', { 
        activePage: 'login', 
        error: 'Invalid username or password' 
      });
    }
    
    // Set session data
    req.session.user = {
      id: user.id,
      username: user.username,
      name: user.name || username,
      role: user.role || 'user'
    };
    
    // Redirect to dashboard or requested page
    res.redirect(returnUrl);
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { 
      activePage: 'login', 
      error: 'An error occurred during login. Please try again.' 
    });
  }
});

// Register form submission handler
app.post('/register', async (req, res) => {
  try {
    const { username, password, confirmPassword, name } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.render('register', { 
        activePage: 'register', 
        error: 'Username and password are required' 
      });
    }
    
    if (password !== confirmPassword) {
      return res.render('register', { 
        activePage: 'register', 
        error: 'Passwords do not match' 
      });
    }
    
    // Check if username already exists
    const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.render('register', { 
        activePage: 'register', 
        error: 'Username already exists' 
      });
    }
    
    // Hash password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    await db.run(
      'INSERT INTO users (username, password, name, role, active) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, name || username, 'user', 1]
    );
    
    // Redirect to login page with success message
    res.render('login', { 
      activePage: 'login', 
      success: 'Registration successful! You can now log in.' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.render('register', { 
      activePage: 'register', 
      error: 'An error occurred during registration. Please try again.' 
    });
  }
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// Handle logout
app.get('/logout', (req, res) => {
  // Destroy session
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

// ============================================================================
// PAGE ROUTES
// ============================================================================

// Root route without forced redirection for authenticated users
app.get('/', (req, res) => {
  // Render the index page regardless of authentication status
  // This lets logged-in users still see the homepage when they click Home
  res.render('index', { 
    activePage: 'home'
  });
});

// Help page
app.get('/help', (req, res) => {
  res.render('help', { activePage: 'help' });
});

// FAQ page
app.get('/faq', (req, res) => {
  res.render('faq', { 
    isAuthenticated: req.session.isAuthenticated || false,
    activePage: 'faq'
  });
});

// Profile route (protected)
app.get('/profile', checkAuth, (req, res) => {
  res.render('profile', { 
    user: req.session.user, 
    activePage: 'profile'
  });
});

// Apply leave page (protected)
app.get('/apply-leave', checkAuth, async (req, res) => {
  try {
    const employeeId = req.session.user.id;
    const leaveData = await Leave.getLeaveSummary(employeeId);
    
    res.render('apply-leave', { 
      leaveData, 
      activePage: 'apply-leave' 
    });
  } catch (error) {
    console.error('Error fetching leave data:', error);
    res.render('apply-leave', { 
      errorMessage: 'Failed to load leave data', 
      leaveData: { totalQuota: 0, usedLeaves: 0, requests: [] },
      activePage: 'apply-leave' 
    });
  }
});

// Leave request form (protected)
app.get('/leave-request', checkAuth, (req, res) => {
  // Mock user data
  const userData = {
    employeeId: 'EMP123',
    name: req.session.user.name,
    email: `${req.session.user.username}@example.com`
  };
  res.render('leave-request', { 
    userData, 
    activePage: 'leave-request' 
  });
});

// Handle leave submission
app.post('/submit-leave', checkAuth, async (req, res) => {
  try {
    const { startDate, endDate, leaveType, reason } = req.body;
    const employeeId = req.session.user.id;
    
    // Calculate business days between the dates
    const calculateBusinessDays = (start, end) => {
      let count = 0;
      let currentDate = new Date(start);
      const endDate = new Date(end);
      
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return count;
    };
    
    const days = calculateBusinessDays(startDate, endDate);
    
    // Create the leave request
    await Leave.create({
      employeeId,
      startDate,
      endDate,
      leaveType,
      reason,
      days
    });
    
    res.redirect('/apply-leave?success=Your leave request has been submitted successfully');
  } catch (error) {
    console.error('Error submitting leave request:', error);
    res.redirect('/apply-leave?error=Failed to submit leave request');
  }
});

// Use admin routes
app.use('/admin', adminRoutes);

// ============================================================================
// TIMESHEET ROUTES
// ============================================================================

// Dashboard route (protected)
app.get('/dashboard', checkAuth, (req, res) => {
  const userId = req.session.user.id || req.session.user.username;
  const now = new Date();
  
  // Get summary data for the dashboard
  let remainingHours = 0;
  let userEntry = userTimeEntries[userId];
  
  // If this is a new user, initialize their time entries
  if (!userEntry) {
    userEntry = userTimeEntries[userId] = {
      currentDay: null,
      entries: [],
      activeEntry: null
    };
  }
  
  if (userEntry.activeEntry) {
    // Calculate remaining hours
    const loginTime = userEntry.activeEntry.login;
    const elapsedMinutes = calculateTimeDiff(loginTime, formatTime(now));
    
    let pauseMinutes = calculateTimeDiff('00:00', userEntry.activeEntry.pause);
    let unavailableMinutes = calculateTimeDiff('00:00', userEntry.activeEntry.unavailable);
    
    if (userEntry.activeEntry.pauseStart) {
      pauseMinutes += calculateTimeDiff(userEntry.activeEntry.pauseStart, formatTime(now));
    }
    
    if (userEntry.activeEntry.unavailableStart) {
      unavailableMinutes += calculateTimeDiff(userEntry.activeEntry.unavailableStart, formatTime(now));
    }
    
    const workedMinutes = elapsedMinutes - (pauseMinutes + unavailableMinutes);
    remainingHours = (480 - workedMinutes) / 60; // Assuming 8-hour workday (480 minutes)
    if (remainingHours < 0) remainingHours = 0;
  }
  
  const dashboardData = {
    activeEntry: userEntry.activeEntry,
    remainingHours: remainingHours.toFixed(1),
    recentEntries: userEntry.entries.slice(0, 3) // Latest 3 entries
  };
  
  res.render('dashboard', { 
    ...dashboardData,
    activePage: 'dashboard'
  });
});

// Timesheet page (protected)
app.get('/timesheet', checkAuth, (req, res) => {
  const userId = req.session.user.id || req.session.user.username;
  const now = new Date();
  
  // Check for active entry and calculate remaining hours
  let loginTime = '---';
  let remainingHours = 0;
  
  // Initialize user entry if it doesn't exist
  if (!userTimeEntries[userId]) {
    userTimeEntries[userId] = {
      currentDay: null,
      entries: [],
      activeEntry: null
    };
  }
  
  const userEntry = userTimeEntries[userId];
  
  if (userEntry.activeEntry) {
    loginTime = userEntry.activeEntry.login;
    
    // Calculate elapsed time in minutes
    const elapsedMinutes = calculateTimeDiff(loginTime, formatTime(now));
    
    // Calculate pause and unavailable time
    let pauseMinutes = calculateTimeDiff('00:00', userEntry.activeEntry.pause);
    let unavailableMinutes = calculateTimeDiff('00:00', userEntry.activeEntry.unavailable);
    
    // Add current pause if on break
    if (userEntry.activeEntry.pauseStart) {
      pauseMinutes += calculateTimeDiff(userEntry.activeEntry.pauseStart, formatTime(now));
    }
    
    // Add current unavailable if unavailable
    if (userEntry.activeEntry.unavailableStart) {
      unavailableMinutes += calculateTimeDiff(userEntry.activeEntry.unavailableStart, formatTime(now));
    }
    
    // Calculate worked time
    const workedMinutes = elapsedMinutes - (pauseMinutes + unavailableMinutes);
    
    // 8-hour workday = 480 minutes
    remainingHours = (480 - workedMinutes) / 60;
    if (remainingHours < 0) remainingHours = 0;
  }
  
  const timesheetData = {
    loginTime: loginTime,
    remainingHours: remainingHours,
    timeEntries: userEntry.entries,
    activeEntry: userEntry.activeEntry
  };
  
  res.render('timesheet', { 
    timesheetData, 
    activePage: 'timesheet' 
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

// Get timesheet status
app.get('/api/timesheet-status', checkAuth, (req, res) => {
  const userId = req.session.user.id || req.session.user.username;
  
  // Initialize user entry if it doesn't exist
  if (!userTimeEntries[userId]) {
    userTimeEntries[userId] = {
      currentDay: null,
      entries: [],
      activeEntry: null
    };
  }
  
  res.json({
    activeEntry: userTimeEntries[userId].activeEntry,
    entries: userTimeEntries[userId].entries.slice(0, 10) // Return last 10 entries
  });
});

// Clock in route
app.post('/api/clock-in', checkAuth, (req, res) => {
  const userId = req.session.user.id || req.session.user.username;
  
  // Initialize user entry if it doesn't exist
  if (!userTimeEntries[userId]) {
    userTimeEntries[userId] = {
      currentDay: null,
      entries: [],
      activeEntry: null
    };
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Check if already clocked in today
  const existingEntry = userTimeEntries[userId].entries.find(entry => entry.date === today);
  
  if (existingEntry && existingEntry.status !== 'complete') {
    return res.status(400).json({ error: 'Already clocked in today' });
  }
  
  const currentTime = formatTime(now);
  
  const newEntry = {
    date: today,
    login: currentTime,
    logout: '',
    pause: '00:00',
    unavailable: '00:00',
    totalAvailable: '00:00',
    status: 'active',
    pauseStart: null,
    unavailableStart: null
  };
  
  userTimeEntries[userId].entries.unshift(newEntry);
  userTimeEntries[userId].activeEntry = newEntry;
  userTimeEntries[userId].currentDay = today;
  
  res.json({ success: true, entry: newEntry });
});

// Clock out route
app.post('/api/clock-out', checkAuth, (req, res) => {
  const userId = req.session.user.id || req.session.user.username;
  
  if (!userTimeEntries[userId] || 
      !userTimeEntries[userId].activeEntry || 
      userTimeEntries[userId].activeEntry.status !== 'active') {
    return res.status(400).json({ error: 'Not clocked in' });
  }
  
  const userEntry = userTimeEntries[userId];
  const now = new Date();
  const currentTime = formatTime(now);
  
  // Handle any active pauses or unavailable periods
  if (userEntry.activeEntry.pauseStart) {
    const pauseMinutes = calculateTimeDiff(userEntry.activeEntry.pauseStart, currentTime);
    const currentPauseMinutes = calculateTimeDiff('00:00', userEntry.activeEntry.pause);
    userEntry.activeEntry.pause = formatMinutes(currentPauseMinutes + pauseMinutes);
    userEntry.activeEntry.pauseStart = null;
  }
  
  if (userEntry.activeEntry.unavailableStart) {
    const unavailableMinutes = calculateTimeDiff(userEntry.activeEntry.unavailableStart, currentTime);
    const currentUnavailableMinutes = calculateTimeDiff('00:00', userEntry.activeEntry.unavailable);
    userEntry.activeEntry.unavailable = formatMinutes(currentUnavailableMinutes + unavailableMinutes);
    userEntry.activeEntry.unavailableStart = null;
  }
  
  // Calculate total available time
  const loginMinutes = calculateTimeDiff('00:00', userEntry.activeEntry.login);
  const logoutMinutes = calculateTimeDiff('00:00', currentTime);
  const pauseMinutes = calculateTimeDiff('00:00', userEntry.activeEntry.pause);
  const unavailableMinutes = calculateTimeDiff('00:00', userEntry.activeEntry.unavailable);
  
  const totalAvailableMinutes = (logoutMinutes - loginMinutes) - (pauseMinutes + unavailableMinutes);
  
  userEntry.activeEntry.logout = currentTime;
  userEntry.activeEntry.totalAvailable = formatMinutes(totalAvailableMinutes);
  userEntry.activeEntry.status = 'complete';
  userEntry.activeEntry = null;
  
  res.json({ success: true });
});

// Start break route
app.post('/api/start-break', checkAuth, (req, res) => {
  const userId = req.session.user.id || req.session.user.username;
  
  if (!userTimeEntries[userId] || 
      !userTimeEntries[userId].activeEntry || 
      userTimeEntries[userId].activeEntry.status !== 'active') {
    return res.status(400).json({ error: 'Not clocked in' });
  }
  
  const userEntry = userTimeEntries[userId];
  
  // If already on break
  if (userEntry.activeEntry.pauseStart) {
    return res.status(400).json({ error: 'Already on break' });
  }
  
  // If unavailable, end that first
  if (userEntry.activeEntry.unavailableStart) {
    const now = new Date();
    const currentTime = formatTime(now);
    
    const unavailableMinutes = calculateTimeDiff(userEntry.activeEntry.unavailableStart, currentTime);
    const currentUnavailableMinutes = calculateTimeDiff('00:00', userEntry.activeEntry.unavailable);
    userEntry.activeEntry.unavailable = formatMinutes(currentUnavailableMinutes + unavailableMinutes);
    userEntry.activeEntry.unavailableStart = null;
  }
  
  const now = new Date();
  userEntry.activeEntry.pauseStart = formatTime(now);
  
  res.json({ success: true });
});

// End break route
app.post('/api/end-break', checkAuth, (req, res) => {
  const userId = req.session.user.id || req.session.user.username;
  
  if (!userTimeEntries[userId] || 
      !userTimeEntries[userId].activeEntry || 
      !userTimeEntries[userId].activeEntry.pauseStart) {
    return res.status(400).json({ error: 'Not on break' });
  }
  
  const userEntry = userTimeEntries[userId];
  const now = new Date();
  const currentTime = formatTime(now);
  
  const pauseMinutes = calculateTimeDiff(userEntry.activeEntry.pauseStart, currentTime);
  const currentPauseMinutes = calculateTimeDiff('00:00', userEntry.activeEntry.pause);
  
  userEntry.activeEntry.pause = formatMinutes(currentPauseMinutes + pauseMinutes);
  userEntry.activeEntry.pauseStart = null;
  
  res.json({ success: true });
});

// Start unavailable route
app.post('/api/start-unavailable', checkAuth, (req, res) => {
  const userId = req.session.user.id || req.session.user.username;
  
  // Initialize user entry if it doesn't exist
  if (!userTimeEntries[userId]) {
    userTimeEntries[userId] = {
      currentDay: null,
      entries: [],
      activeEntry: null
    };
  }
  
  const userEntry = userTimeEntries[userId];
  
  if (!userEntry.activeEntry || userEntry.activeEntry.status !== 'active') {
    return res.status(400).json({ error: 'Not clocked in' });
  }
  
  // If already unavailable
  if (userEntry.activeEntry.unavailableStart) {
    return res.status(400).json({ error: 'Already unavailable' });
  }
  
  // If on break, end that first
  if (userEntry.activeEntry.pauseStart) {
    const now = new Date();
    const currentTime = formatTime(now);
    
    const pauseMinutes = calculateTimeDiff(userEntry.activeEntry.pauseStart, currentTime);
    const currentPauseMinutes = calculateTimeDiff('00:00', userEntry.activeEntry.pause);
    userEntry.activeEntry.pause = formatMinutes(currentPauseMinutes + pauseMinutes);
    userEntry.activeEntry.pauseStart = null;
  }
  
  const now = new Date();
  userEntry.activeEntry.unavailableStart = formatTime(now);
  
  res.json({ success: true });
});

// End unavailable route
app.post('/api/end-unavailable', checkAuth, (req, res) => {
  const userId = req.session.user.id || req.session.user.username;
  
  if (!userTimeEntries[userId] || 
      !userTimeEntries[userId].activeEntry || 
      !userTimeEntries[userId].activeEntry.unavailableStart) {
    return res.status(400).json({ error: 'Not unavailable' });
  }
  
  const userEntry = userTimeEntries[userId];
  const now = new Date();
  const currentTime = formatTime(now);
  
  const unavailableMinutes = calculateTimeDiff(userEntry.activeEntry.unavailableStart, currentTime);
  const currentUnavailableMinutes = calculateTimeDiff('00:00', userEntry.activeEntry.unavailable);
  
  userEntry.activeEntry.unavailable = formatMinutes(currentUnavailableMinutes + unavailableMinutes);
  userEntry.activeEntry.unavailableStart = null;
  
  res.json({ success: true });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Error handling for unhandled errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});