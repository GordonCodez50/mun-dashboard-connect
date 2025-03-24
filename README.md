
# MUN Conference Dashboard

A real-time dashboard for Model United Nations conferences that enables chairs and admins to communicate effectively during sessions.

## Features

- **Real-time Updates**: Live alerts, council status updates, and timers
- **Secure Authentication**: Role-based access control for chairs and admins
- **Responsive Design**: Works on all devices from desktop to mobile
- **User Management**: Create and manage chair and admin accounts
- **Document Sharing**: Share and access conference documents

## Setup & Deployment

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Access the application at http://localhost:5173

### Production Deployment (Vercel)

This application is configured for seamless deployment on Vercel:

1. Connect your repository to Vercel
2. Set the following environment variables (optional):
   - `VITE_WS_ENDPOINT`: WebSocket server endpoint (if using a real backend)
   - `VITE_SIMULATION_MODE`: Set to 'false' to use real WebSocket connection

## System Administration Guide

### Accessing the System

1. **Default Admin Account**:
   - Username: `admin`
   - Password: `password`
   - **Important**: Change this password after first login in a production environment

2. **Default Chair Account**:
   - Username: `chair`
   - Password: `password`

### User Management

#### Creating a New User

1. Log in with an admin account
2. Navigate to "User Management" in the sidebar
3. Click "Create New User"
4. Fill in the required fields:
   - **Username**: Unique identifier for login
   - **Password**: Secure password for the user
   - **Full Name**: User's complete name
   - **Role**: Select either "Chair" or "Admin"
   - **Council** (for Chair only): Assign the chair to a specific council
   - **Email**: Optional contact information

5. Click "Create User" to add the user to the system

#### Deleting a User

1. Navigate to "User Management" in the sidebar
2. Find the user you want to delete in the list
3. Click the "Delete" button next to their name
4. Confirm the deletion when prompted

### Admin Functions

As an admin, you can:

- View all council statuses on the Admin Panel
- Respond to alerts from chairs
- Acknowledge and resolve issues
- Monitor council sessions in real-time
- Manage users through the User Management page
- Control common timers for all councils

### Chair Functions

As a chair, you can:

- Update your council's status (in session, on break, technical issue)
- Send alerts to admins for assistance
- Control a council-specific timer
- Access shared documents
- Use the dashboard to manage your council session

## Technical Information

- Built with React, TypeScript, and Tailwind CSS
- Uses WebSockets for real-time communication
- Implements shadcn/ui components for consistent design
- Deploys seamlessly to Vercel

## Production Mode

To switch from simulation mode to production mode:

1. Set up a WebSocket server backend
2. Set `VITE_SIMULATION_MODE=false` in your environment variables
3. Set `VITE_WS_ENDPOINT` to your WebSocket server URL

## Security Notes

- In production, replace the localStorage-based authentication with a proper authentication system
- Secure your WebSocket connections with proper authentication
- Update default passwords immediately
