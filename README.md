

# ISB MUN Conference Dashboard

A real-time dashboard for Model United Nations conferences that enables chairs and admins to communicate effectively during sessions.

## Features

- **Real-time Updates**: Live alerts, council status updates, and timers
- **Secure Authentication**: Role-based access control for chairs and admins
- **Email-based Role Recognition**: User roles determined by email format
- **Responsive Design**: Works on all devices from desktop to mobile
- **Document Sharing**: Share and access conference documents
- **Two-way Communication**: Chairs and admins can reply to alerts and messages

## 🚀 Setup & Deployment (For 15-Year-Olds!)

### Step 1: Firebase Setup

1. Your Firebase project is already created! The name is "isbmun-dashboard"
2. Make sure these services are enabled in the Firebase console (https://console.firebase.google.com/):
   - Authentication (click on "Authentication" in the sidebar and enable Email/Password provider)
   - Firestore Database (click on "Firestore Database" and create a database in production mode)
   - Realtime Database (click on "Realtime Database" and create a database)

### Step 2: Create User Accounts

1. Go to the Firebase console and click on "Authentication"
2. Click on "Add User" and create accounts based on these formats:
   - Chair accounts: `chair-COUNCILNAME@isbmun.com` (e.g., chair-ecosoc@isbmun.com)
   - Admin accounts: `admin@isbmun.com` or any email starting with "admin"
   - Press accounts: `press@isbmun.com` or any email starting with "press"
3. Set their passwords

The system automatically recognizes:
- Emails starting with "chair-" as chair accounts (with council name extracted from email)
- Emails starting with "admin" as admin accounts
- Emails starting with "press" as press accounts (with same access as chairs)

### Step 3: Firebase Rules Setup

1. Go to the Firebase console and click on "Firestore Database"
2. Click on the "Rules" tab and replace the rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to authenticated users
    match /{document=**} {
      allow read: if request.auth != null;
    }
    
    // Allow chairs to update only their own council data
    match /councils/{councilId} {
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.council == resource.data.name);
    }
    
    // Allow users to create and update their own user data
    match /users/{userId} {
      allow write: if request.auth != null && 
        (request.auth.uid == userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Only admins can create or delete documents
    match /documents/{docId} {
      allow create, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow both chairs and admins to create alerts
    match /alerts/{alertId} {
      allow write: if request.auth != null;
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
    },
    "DIRECT_MESSAGES": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

4. Click "Publish" on both rule sets!

### Step 4: Set Up Timer Sounds

For the timer notification sounds to work correctly, follow these steps:

1. **Upload Sound Files to Firebase Storage:**
   - Go to Firebase Console → Storage
   - Create a new bucket if you don't have one
   - Upload your timer sound files (MP3 format is recommended)
   - Make the files publicly accessible by clicking on the file → Permissions → Add a new principal → allUsers → Role: Storage Object Viewer

2. **Get the Public URLs:**
   - After uploading, click on each sound file
   - Copy the "Public URL" from the file details panel

3. **Replace the Sound URLs in the code:**
   - In the `TimerManager.tsx` and `ChairDashboard.tsx` files, replace the existing URLs with your new public URLs
   - Look for these lines:
     ```javascript
     const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
     // and
     notificationSound.current = new Audio("https://pixabay.com/sound-effects/notification-18-270129/");
     ```

4. **Recommended Sound Files:**
   - Timer completion sound: A clear alarm sound (5-10 seconds)
   - Alert notification sound: A short notification sound (1-2 seconds)

With these steps, the timer sounds will work reliably across all browsers and devices.

### Step 5: Deploy to Vercel (Super Easy!)

1. Create a Vercel account if you don't have one: https://vercel.com/signup
2. Install the Vercel CLI: `npm install -g vercel`
3. In your project folder, run: `vercel login`
4. Then run: `vercel`
5. Follow the prompts (mostly just press Enter for the default options)
6. Your app is deployed! 🎉

## Using Email-Based Role Recognition

This app uses a special system to determine user roles based on email addresses:

### Chair Accounts
- Format: `chair-COUNCILNAME@isbmun.com`
- Example: `chair-ecosoc@isbmun.com`
- The app automatically extracts "ECOSOC" as the council name
- Chair users can only send alerts from their assigned council

### Admin Accounts
- Format: Any email starting with "admin"
- Example: `admin@isbmun.com`
- Admins can see and manage all councils, alerts, and users

### Press Accounts
- Format: Any email starting with "press"
- Example: `press@isbmun.com`
- Press users have similar access to chairs but are assigned to the "PRESS" council

## Troubleshooting

### "Can't Log In" Problems
- Make sure you've enabled Email/Password authentication in Firebase
- Check if you're using the correct email format (chair-councilname@isbmun.com or admin@isbmun.com)
- Make sure the account exists in Firebase Authentication
- Try using the demo accounts if nothing else works

### "No Councils Showing" Problems
- Councils are automatically created when chair users log in
- Make sure chair emails follow the format `chair-COUNCILNAME@isbmun.com`
- Check your Firebase rules to make sure they allow reading/writing

### "No Real-time Updates" Problems
- Check your Firebase rules to make sure they allow reading/writing
- Make sure `VITE_FIREBASE_DEMO_MODE` is set to `false`
- Check the browser console for errors (press F12 to open developer tools)

### "Timer Sounds Not Working" Problems
- Check if your browser allows autoplay of audio
- Make sure the sound file URLs are accessible
- Try using a different sound file format (MP3 is most compatible)
- Check the browser console for any errors related to audio playback

### "Deployment Failed" Problems
- Make sure all environment variables are set correctly in Vercel
- Try running `vercel --prod` to force a production build

Need more help? Ask your teacher or IT support person!

