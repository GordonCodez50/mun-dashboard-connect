
# MUN Conference Dashboard

A real-time dashboard for Model United Nations conferences that enables chairs and admins to communicate effectively during sessions.

## Features

- **Real-time Updates**: Live alerts, council status updates, and timers
- **Secure Authentication**: Role-based access control for chairs and admins
- **Responsive Design**: Works on all devices from desktop to mobile
- **User Management**: Create and manage chair and admin accounts
- **Document Sharing**: Share and access conference documents

## 🚀 Setup & Deployment (For 15-Year-Olds!)

### Step 1: Firebase Setup

1. Your Firebase project is already created! The name is "isbmun-dashboard"
2. Make sure these services are enabled in the Firebase console (https://console.firebase.google.com/):
   - Authentication (click on "Authentication" in the sidebar and enable Email/Password provider)
   - Firestore Database (click on "Firestore Database" and create a database in production mode)
   - Realtime Database (click on "Realtime Database" and create a database)

### Step 2: Firebase Rules Setup

1. Go to the Firebase console and click on "Firestore Database"
2. Click on the "Rules" tab and replace the rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    match /councils/{councilId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /documents/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /alerts/{alertId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Now go to "Realtime Database" and click on the "Rules" tab, then replace the rules with:

```json
{
  "rules": {
    "councilStatus": {
      ".read": "auth != null",
      "$councilId": {
        ".write": "auth != null"
      }
    },
    "alerts": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "timers": {
      ".read": "auth != null",
      "$timerId": {
        ".write": "auth != null"
      }
    }
  }
}
```

4. Click "Publish" on both rule sets!

### Step 3: Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Make sure your `.env` file has all the Firebase info (see `.env.example`)
4. Start the development server: `npm run dev`
5. Access the application at http://localhost:5173

### Step 4: Deploy to Vercel (Super Easy!)

1. Create a Vercel account if you don't have one: https://vercel.com/signup
2. Install the Vercel CLI: `npm install -g vercel`
3. In your project folder, run: `vercel login`
4. Then run: `vercel`
5. Follow the prompts (mostly just press Enter for the default options)
6. Your app is deployed! 🎉

### Step 5: Adding Users and Settings Things Up

1. When you first deploy, the system will be in "demo mode" with these accounts:
   - Admin: `admin@example.com` / password: `password`
   - Chair: `chair@example.com` / password: `password`

2. **Adding a New User**:
   - Log in with the admin account
   - Go to "User Management" in the sidebar
   - Click "Create New User"
   - Fill in their details (name, email, role, etc.)
   - Click "Create User"

3. **Creating a New Council**:
   - Log in with the admin account
   - Go to "Council Status" in the sidebar
   - Click "Add New Council" button
   - Fill in the council details
   - Click "Create Council"

4. **Assigning Chairs to Councils**:
   - When creating or editing a chair's profile, select their council from the dropdown menu
   - Click "Save" to update

## Troubleshooting

### "Can't Log In" Problems
- Make sure you've enabled Email/Password authentication in Firebase
- Check if you're using the correct email and password
- Try using the demo accounts if nothing else works

### "No Real-time Updates" Problems
- Check your Firebase rules to make sure they allow reading/writing
- Make sure `VITE_FIREBASE_DEMO_MODE` is set to `false`
- Check the browser console for errors (press F12 to open developer tools)

### "Deployment Failed" Problems
- Make sure all environment variables are set correctly in Vercel
- Try running `vercel --prod` to force a production build

## Firebase Security Rules Explained

The Firebase security rules we set up protect your data while allowing the right people to access it:

### Firestore Rules
- Only authenticated users can read data
- Only admins can create/modify councils and documents
- Users can only modify their own user data (except admins who can modify anyone)

### Realtime Database Rules
- Only authenticated users can read real-time updates
- Council status and timers can be updated by authenticated users (both chairs and admins)
- Alerts can be created and read by all authenticated users

Need more help? Ask your teacher or IT support person!
