
# MUN Conference Dashboard

A comprehensive dashboard for Model United Nations conferences with cross-platform notifications support.

## Features

- Real-time alerts and notifications
- Timer management
- Cross-platform notifications (iOS, Android, Desktop)
- Lock screen notifications for mobile devices
- PWA support for better mobile experience

## Technical Implementation

### Notifications

The application implements a robust notification system that works across different platforms:

- **Browser Notifications**: Using the Web Notifications API
- **Firebase Cloud Messaging (FCM)**: For push notifications
- **Lock Screen Notifications**: For Android and iOS devices
- **PWA Support**: For better integration on mobile devices

### Setup Requirements

#### Firebase Configuration

1. Ensure Firebase configuration is set up correctly in `src/config/firebaseConfig.ts`
2. The Firebase Messaging Service Worker (`public/firebase-messaging-sw.js`) must be deployed to the root of the domain

#### PWA Configuration

1. Ensure the Web App Manifest (`public/manifest.json`) is properly configured
2. Set the correct icons in the manifest for PWA installation

#### VAPID Key

1. Make sure to set the correct VAPID key in both:
   - `src/services/notificationService.ts`
   - `src/utils/fcmUtils.ts`

## Development Guidelines

### Testing Notifications

1. Enable notifications in your browser
2. For mobile testing, use a real device or an emulator with notification support
3. For iOS, install as PWA for better notification support

### Browser Compatibility

The notification system is designed to work on:
- Chrome (Desktop & Mobile)
- Safari (Desktop & iOS)
- Firefox
- Edge

### Known Limitations

- iOS Safari has limited notification support in regular browser mode
- PWA installation is recommended for iOS users

## Deployment

When deploying to production:

1. Make sure the service worker is properly registered
2. Test notifications on all target platforms
3. Verify that FCM tokens are being correctly generated and stored
4. Ensure all security rules are properly configured in Firebase

