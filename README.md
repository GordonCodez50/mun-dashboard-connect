
# MUN Conference Dashboard - Cross-Platform Notifications

This MUN Conference Dashboard application includes comprehensive cross-platform notification support for all devices and browsers.

## Notification Support

The application provides push notifications on:
- **Android** devices (Chrome, Firefox, Samsung Internet)
- **iOS** devices (Safari, Chrome, as PWA)
- **Windows** (Chrome, Firefox, Edge)
- **macOS** (Safari, Chrome, Firefox)
- **Linux** (Chrome, Firefox)

## Getting Started with Notifications

### Basic Requirements

1. For the best experience, users on mobile devices should install the application as a Progressive Web App (PWA).
2. For desktop browsers, notifications are supported in most modern browsers with some minor differences in behavior.

### Setting Up Notifications

When using the application:

1. You will be prompted to allow notifications when appropriate.
2. Grant permission when requested to receive important alerts.
3. On mobile devices, consider installing the app to your home screen for lock screen notifications.

### iOS Setup

For iOS users:
1. **Safari Browser**: Add the application to your home screen for the best notification experience.
   - Tap the Share button
   - Select "Add to Home Screen"
   - Launch the application from the home screen icon

2. **Chrome/Firefox on iOS**: These browsers have limited notification support on iOS. We recommend using the PWA (installed from Safari).

### Android Setup

For Android users:
1. When prompted, allow notifications permission.
2. For lock screen notifications, ensure you have not disabled them in system settings.
3. For optimal performance, install the app to your home screen:
   - Tap the three-dot menu in Chrome
   - Select "Add to Home Screen"

## Troubleshooting Notifications

If you're not receiving notifications:

### On Android:
1. Check notification permissions in system settings:
   - Settings → Apps → [App Name] → Notifications
2. Ensure battery optimization is not restricting the app:
   - Settings → Battery → Battery Optimization → Find and exempt the app

### On iOS:
1. Ensure you've installed the app to your home screen
2. Check notification settings:
   - Settings → Notifications → Find the application
3. Background App Refresh should be enabled:
   - Settings → General → Background App Refresh

### On Desktop:
1. Check browser notification permissions:
   - Site Settings/Preferences → Notifications
2. Ensure your browser is not in Do Not Disturb mode
3. On macOS, check System Preferences → Notifications for the browser

## Technical Implementation

The notification system uses:
1. Firebase Cloud Messaging (FCM) for cross-platform delivery
2. Service Workers for background notification handling
3. Web Push API for compatible browsers
4. Fallback toast notifications for unsupported browsers

### For Developers

The code includes:
- Platform detection utilities for tailoring notification behavior
- PWA installation guidance for optimal mobile experience
- Service worker enhancements for lock screen notifications
- Graceful degradation for browsers with limited support

## Support

If you encounter any issues with notifications, please:
1. Check your browser and device settings
2. Verify your internet connection
3. Try refreshing the application
4. Contact support if problems persist

