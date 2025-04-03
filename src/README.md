
# MUN Dashboard Quick Guide

## Customizing the Chair & Press Dashboard

### How to Modify Quick Actions/Alerts

The quick actions in both Chair and Press dashboards can be customized by modifying their respective files:

#### For Chair Dashboard (ChairDashboard.tsx):

1. Open `src/pages/ChairDashboard.tsx`
2. Find the "Quick Actions" section (around line 125)
3. The alerts are defined as `AlertButton` components
4. To add a new alert type:
   ```jsx
   <AlertButton
     icon={<YourIcon size={24} />}
     label="New Alert Type"
     onClick={() => handleAlert('New Alert Type')}
     loading={loadingAlert === 'New Alert Type'}
   />
   ```
5. To modify existing alerts, change the `label` and `icon` properties
6. You may need to update the `getAlertMessage` function to handle your new alert type

#### For Press Dashboard (PressDashboard.tsx):

1. Open `src/pages/PressDashboard.tsx`  
2. Find the "Quick Actions" section
3. Modify the existing buttons to change their functionality
4. For the "Need Help at [location]" button, you can modify the input field and styling as needed

### Timer Configuration

The timer sound notifications can be customized:

1. Replace the notification sound file in `/public/notification.mp3` with your own sound file
2. Make sure to keep the same filename or update the reference in `QuickTimerWidget.tsx`
3. For more extensive timer customization, edit `src/components/ui/QuickTimerWidget.tsx`

### Alert Sound Notifications

Admin panel alert sounds can be configured:

1. Replace the notification sound file in `/public/notification.mp3` with your preferred sound
2. To toggle notifications, use the "Mute Alerts" button in the Admin Panel header
3. You can edit the sound behavior in `src/hooks/useAlertsSound.tsx`

### User Email Formats

User roles are determined by email prefixes:

- Chair users: `chair-COUNCILNAME@isbmun.com` (e.g., `chair-unsc@isbmun.com`)
- Admin users: `admin-NAME@isbmun.com` (e.g., `admin-john@isbmun.com`) 
- Press users: `press-NAME@isbmun.com` (e.g., `press-jane@isbmun.com`)

These patterns are defined in `src/config/firebaseConfig.ts` and can be modified if needed.

### Dashboard Navigation

- Chairs see the Chair Dashboard and Timer pages
- Press users see only the Press Dashboard (no Timer page)
- Admins see the Admin Panel and User Management pages

### Mobile Navigation

The application features a responsive design with a hamburger menu for mobile users:
- On mobile devices, a hamburger menu icon appears in the top-right corner
- Tapping this icon opens a drawer with all navigation options
- The same links and functionality are available on mobile as on desktop

