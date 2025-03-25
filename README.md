# Better-Time-Management
It's just better   ¬‿¬

# Time Management Application

A comprehensive time management application built with Node.js and Express.js that helps employees track work hours, manage leaves, and improve productivity.

## Features

- **User Authentication**
  - Secure login system
  - Role-based access control (Admin/Employee)
  - Session management

- **Time Tracking**
  - Track daily work hours
  - Monitor breaks and pause time
  - Calculate available work time
  - Automated timesheet generation

- **Leave Management**
  - Apply for leaves
  - Track leave balance
  - View leave history
  - Leave approval workflow

- **Admin Dashboard**
  - View all employee timesheets
  - Monitor compliance
  - Generate reports
  - Manage user accounts

- **Responsive Design**
  - Works seamlessly on desktop and mobile
  - Dark/Light theme support
  - Intuitive user interface

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/time-management-app.git
cd time-management-app
```

2. Install dependencies
```bash
npm install sqlite3 express-sessions express bcrypt
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the application
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## Usage

1. Access the application at `http://localhost:3001`
2. Log in with your credentials
3. Navigate through the features:
   - View and manage your timesheet
   - Apply for leaves
   - Check leave balance
   - View reports (Admin only)

## Project Structure

```
time-management-app/
├── config/              # Configuration files
├── controllers/         # Route controllers
├── models/             # Database models
├── public/             # Static assets
│   ├── css/           # Stylesheets
│   ├── js/            # Client-side JavaScript
│   └── img/           # Images and icons
├── routes/            # Express routes
├── utils/             # Utility functions
├── views/             # EJS templates
│   └── partials/      # Reusable template parts
├── app.js             # Application entry point
└── package.json       # Project dependencies
```

## Technology Stack

- **Backend**
  - Node.js
  - Express.js
  - SQLite3
  - express-session

- **Frontend**
  - HTML5
  - CSS3
  - JavaScript (ES6+)
  - Bootstrap 5
  - Font Awesome

- **Template Engine**
  - EJS (Embedded JavaScript)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Bootstrap team for the UI framework
- Font Awesome for the icons
- Express.js team for the web framework
