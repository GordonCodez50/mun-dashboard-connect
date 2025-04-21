
# MUN Conference Dashboard

A completex dashboard solution for Model United Nations (MUN) conferences.

## Features

- User authentication with different roles (Admin, Chair)
- Council management
- Attendance tracking
- Document sharing
- Alert system for chairs to request assistance
- Timer management for debates and speeches

## Firebase Configuration

### Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow admins to read and write all documents
    match /{document=**} {
      allow read, write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow chair users to read all documents
    match /{document=**} {
      allow read: if request.auth != null;
    }
    
    // Allow all authenticated users to read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow chair users to update their own council's information
    match /councils/{councilId} {
      allow update: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.council == resource.data.name;
    }
    
    // Participants collection rules
    match /participants/{participantId} {
      // All authenticated users can read participants
      allow read: if request.auth != null;
      
      // Chair users can only create and update participants for their own council
      allow create, update: if request.auth != null &&
                              (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
                              (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'chair' &&
                              get(/databases/$(database)/documents/users/$(request.auth.uid)).data.council == request.resource.data.council));
      
      // Only admins can delete participants
      allow delete: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow chair users to create alerts
    match /alerts/{alertId} {
      allow create: if request.auth != null && 
                     request.resource.data.council == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.council;
    }
    
    // Allow users to read documents
    match /documents/{documentId} {
      allow read: if request.auth != null;
    }
  }
}
```

### Realtime Database Security Rules

```
{
  "rules": {
    // Allow all authenticated users to read data
    ".read": "auth != null",
    
    "alerts": {
      // Allow authenticated users to read and create alerts
      ".read": "auth != null",
      ".write": "auth != null",
      
      "$alertId": {
        // Anyone can read alerts
        ".read": true,
        
        // Authenticated users can update alerts
        ".write": "auth != null"
      }
    },
    
    "timers": {
      // Allow access to timers for authenticated users
      ".read": "auth != null",
      ".write": "auth != null",
      
      "$timerId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

## Database Structure

### Firestore Collections

- **users**: User accounts with roles and council assignments
- **councils**: Information about each council/committee
- **participants**: Delegates and chairs with attendance records
- **documents**: Shared documents and resources
- **alerts**: Records of alerts and their status

### Realtime Database

- **alerts**: Real-time alerts from chairs
- **timers**: Speech and debate timers with real-time synchronization

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Configure your Firebase project and add credentials
4. Run the development server with `npm run dev`

## License

This project is licensed under the MIT License - see the LICENSE file for details.
