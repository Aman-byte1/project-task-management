# Project & Task Management Application

A full-stack application for managing projects and tasks with role-based access control. Built with modern technologies and containerized for easy deployment.

## ✨ Features

- **🔐 User Authentication**: JWT-based authentication with secure login/logout
- **👥 Role-Based Access Control**: Two user roles with different permissions:
  - **Admin**: Full access to all resources
  - **Employee**: View and update assigned tasks
- **🌙 Dark/Light Mode**: Toggle between themes
- **⚡ Real-time Updates**: Using RTK Query for efficient data fetching
- **🔍 Task Filtering**: Filter tasks by status, assignee, and project
- **📎 File Attachments**: Upload and manage task attachments
- **⏱️ Time Tracking**: Track time spent on tasks
- **💬 Comments System**: Add comments to tasks
- **🔗 Task Dependencies**: Manage task relationships

## 📸 Screenshots

### Application Interface

**Login Page**
![01-login-page](screenshots/01-login-page.png)
*Login page with authentication form*

**Admin Dashboard**
![02-admin-dashboard](screenshots/02-admin-dashboard.png)
*Admin dashboard main interface*

**Employee Dashboard**
![03-employee-dashboard](screenshots/03-employee-dashboard.png)
*Employee dashboard with task overview*

**Task Creation**
![04-task-creation](screenshots/04-task-creation.png)
*Task creation form with all fields*

**Task Filtering**
![05-task-filtering](screenshots/05-task-filtering.png)
*Task filtering interface in action*

**Dark Mode**
![06-dark-mode](screenshots/06-dark-mode.png)
*Application in dark mode theme*

**Task Commenting**
![06-task-commenting](screenshots/06-task-commenting.png)
*Task commenting interface*

**Time Tracking**
![07-task-time](screenshots/07-task-time.png)
*Time tracking interface*

**File Attachments**
![08-attaching-files](screenshots/08-attaching-files.png)
*File attachment interface*

## 🛠️ Tech Stack

### Frontend
- React with TypeScript
- Redux Toolkit (RTK) & RTK Query
- React Router for navigation
- Tailwind CSS for styling
- Theme context for dark/light mode

### Backend
- Node.js with Express
- TypeScript
- Sequelize ORM with PostgreSQL
- JWT authentication
- Role-based middleware
- File upload handling with Multer

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository:**
```bash
git clone https://github.com/Aman-byte1/project-task-management.git
cd project-task-management
```

2. **Start the application:**
```bash
docker-compose up -d
```

3. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:5000

### Default Admin User
- Email: admin@example.com
- Password: admin123
- Role: Admin

## 📄 License

MIT
