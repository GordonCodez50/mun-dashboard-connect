
# MUN Admin Dashboard

## Firebase Configuration for Broadcast Messaging

To enable broadcast messaging features in the admin panel, you need to set up the following Firebase configurations:

### Realtime Database Rules

```json
{
  "rules": {
    "alerts": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$alertId": {
        ".read": "auth != null",
        ".write": "auth != null",
        ".validate": "newData.hasChildren(['type', 'message', 'timestamp', 'council'])"
      }
    },
    "timers": {
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

### Firestore Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow chairs to read all documents and write to their own council
    match /documents/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Allow admins to read and write to all councils
    match /councils/{council} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Allow users to read and write their own user documents
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || request.auth.token.admin == true);
      allow write: if request.auth != null && (request.auth.uid == userId || request.auth.token.admin == true);
    }
  }
}
```

### Security Considerations

1. The broadcast messaging system allows administrators to send messages to all chairs or chairs and press simultaneously.
2. Messages sent via broadcast are automatically marked as "resolved" to avoid cluttering the alerts dashboard.
3. All broadcast messages are stored in the same "alerts" node as regular alerts and direct messages, but are tagged with additional metadata.
