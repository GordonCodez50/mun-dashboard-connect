
# MUN Conference Dashboard

A real-time dashboard for Model United Nations conferences that enables chairs and admins to communicate effectively during sessions.

## Features

- **Real-time Updates**: Live alerts, council status updates, and timers
- **Secure Authentication**: Role-based access control for chairs and admins
- **Responsive Design**: Works on all devices from desktop to mobile
- **User Management**: Create and manage chair and admin accounts
- **Document Sharing**: Share and access conference documents

## Setup & Deployment

### Firebase Setup

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable the following services:
   - Authentication (with Email/Password provider)
   - Firestore Database
   - Realtime Database
3. Get your Firebase configuration from Project Settings > General > Your apps > SDK setup and configuration
4. Copy the configuration values to your .env file or directly to the deployment environment variables

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure Firebase variables:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_DATABASE_URL=https://your-project-rtdb.firebaseio.com
   VITE_FIREBASE_DEMO_MODE=true
   ```
4. Start the development server: `npm run dev`
5. Access the application at http://localhost:5173

### Production Deployment (Vercel)

This application is configured for seamless deployment on Vercel:

1. Connect your repository to Vercel
2. Set the following environment variables:
   - `VITE_FIREBASE_API_KEY`: Your Firebase API key
   - `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase Auth domain
   - `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
   - `VITE_FIREBASE_APP_ID`: Your Firebase app ID
   - `VITE_FIREBASE_DATABASE_URL`: Your Realtime Database URL
   - `VITE_FIREBASE_DEMO_MODE`: Set to 'false' in production

3. Deploy the application
4. After deployment, you can access your app at your Vercel URL

## System Administration Guide

### Accessing the System

1. **Default Admin Account**:
   - Email: `admin@example.com`
   - Password: `password`
   - **Important**: Change this password after first login in a production environment

2. **Default Chair Account**:
   - Email: `chair@example.com`
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
   - **Email**: Contact information

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
- Uses Firebase for real-time communication, authentication, and data storage
- Implements shadcn/ui components for consistent design
- Deploys seamlessly to Vercel

## Production Mode

To switch from demo mode to production mode:

1. Create Firebase project with proper security rules
2. Set `VITE_FIREBASE_DEMO_MODE=false` in your environment variables
3. Set all Firebase configuration variables with your project values
4. Consider implementing additional security like Firebase Functions to handle sensitive operations

## Security Notes

- In production, implement proper Firebase security rules
- Use Firebase Authentication for user management
- Set up Firebase Functions for sensitive operations like user deletion
- Update default credentials immediately
- For additional security, consider enabling email verification

## Firebase Rules

### Firestore Security Rules Example

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    match /councils/{councilId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    match /documents/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

### Realtime Database Rules Example

```json
{
  "rules": {
    "councilStatus": {
      ".read": "auth != null",
      "$councilId": {
        ".write": "auth != null && (auth.token.admin === true || auth.token.council === $councilId)"
      }
    },
    "alerts": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "timers": {
      ".read": "auth != null",
      "$timerId": {
        ".write": "auth != null && (auth.token.admin === true || auth.token.council === $timerId)"
      }
    }
  }
}
```
