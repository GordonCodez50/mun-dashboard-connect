
/**
 * Cross-platform notification utilities to handle different devices and browsers
 */

// Feature detection for various notification APIs
export const isServiceWorkerSupported = (): boolean => 
  'serviceWorker' in navigator;

export const isPushManagerSupported = (): boolean => 
  'PushManager' in window;

export const isNotificationSupported = (): boolean => 
  'Notification' in window;

export const isWebPushSupported = (): boolean =>
  isServiceWorkerSupported() && isPushManagerSupported();

// Platform detection utilities
export const isIOS = (): boolean => 
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

export const isSafari = (): boolean => 
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export const isFirefox = (): boolean => 
  navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

export const isChrome = (): boolean => 
  /chrome/i.test(navigator.userAgent.toLowerCase());

export const isAndroid = (): boolean => 
  /android/i.test(navigator.userAgent.toLowerCase());

export const isMobile = (): boolean => 
  /Mobi|Android/i.test(navigator.userAgent);

export const isStandalone = (): boolean => 
  (window.matchMedia('(display-mode: standalone)').matches) || 
  ((window.navigator as any).standalone === true);

// Get browser/platform specific instructions for enabling notifications
export const getNotificationInstructions = (): string => {
  if (isIOS() && isSafari()) {
    return "On iOS Safari, go to Settings → Safari → Advanced → Notifications and allow this site.";
  } else if (isIOS()) {
    return "For the best experience on iOS, add this app to your home screen and launch it from there.";
  } else if (isAndroid() && isChrome()) {
    return "On Android Chrome, tap the three dots (⋮) → Settings → Site Settings → Notifications → find this site and allow notifications.";
  } else if (isFirefox()) {
    return "In Firefox, click the lock icon in the address bar, then select Permissions → Notifications → Allow.";
  } else {
    return "Click the lock icon in your browser's address bar and ensure notifications are allowed for this site.";
  }
};

// Get platform-specific instructions for adding to home screen
export const getInstallInstructions = (): string => {
  if (isIOS() && isSafari()) {
    return "To install: tap the share icon (box with arrow) at the bottom of Safari, then 'Add to Home Screen'.";
  } else if (isAndroid() && isChrome()) {
    return "To install: tap the three dots (⋮) menu and select 'Add to Home Screen'.";
  } else {
    return "This app can be installed on your device for offline use. Look for the install option in your browser menu.";
  }
};

// Create a notification with platform-specific optimizations
export const createNotification = async (
  title: string, 
  options?: NotificationOptions,
  fallbackToast?: (title: string, body?: string) => void
): Promise<boolean> => {
  // Check if notifications are supported
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported in this browser');
    if (fallbackToast) fallbackToast(title, options?.body);
    return false;
  }

  // Check permission
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    if (fallbackToast) fallbackToast(title, options?.body);
    return false;
  }

  try {
    // Platform specific enhancements
    let enhancedOptions = { ...options };
    
    if (isAndroid()) {
      // Android often needs vibration pattern and higher priority
      enhancedOptions.vibrate = enhancedOptions.vibrate || [200, 100, 200];
      enhancedOptions.tag = enhancedOptions.tag || 'important-notification';
      enhancedOptions.renotify = enhancedOptions.renotify || true;
      enhancedOptions.requireInteraction = enhancedOptions.requireInteraction || false;
      enhancedOptions.silent = enhancedOptions.silent || false;
    }
    
    if (isIOS()) {
      // iOS has limitations with service workers, focus on basic notification
      enhancedOptions.badge = enhancedOptions.badge || '/logo.png';
    }

    // Create and show notification
    if (isServiceWorkerSupported() && navigator.serviceWorker.controller) {
      // Prefer showing via active service worker if available (better for mobile)
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, enhancedOptions);
    } else {
      // Fallback to standard notification API
      new Notification(title, enhancedOptions);
    }
    
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    if (fallbackToast) fallbackToast(title, options?.body);
    return false;
  }
};

// Request notification permission with better error handling
export const requestNotificationPermission = async (): Promise<{
  success: boolean;
  status: NotificationPermission | 'unsupported';
  error?: string;
}> => {
  if (!isNotificationSupported()) {
    return { 
      success: false, 
      status: 'unsupported',
      error: getPlatformSpecificNotificationError()
    };
  }
  
  try {
    const permission = await Notification.requestPermission();
    return {
      success: permission === 'granted',
      status: permission
    };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { 
      success: false, 
      status: 'default',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get platform-specific error messages
export const getPlatformSpecificNotificationError = (): string => {
  if (isIOS() && !isSafari()) {
    return "iOS only allows notifications in Safari or when added to home screen.";
  } else if (isIOS()) {
    return "To receive notifications on iOS, add this app to your home screen first.";
  } else if (isAndroid() && !isChrome()) {
    return "For the best notification experience on Android, we recommend Chrome.";
  } else {
    return "Notifications are not supported in your browser.";
  }
};

// Special function for iOS to work around limitations
export const setupIOSNotifications = (): boolean => {
  if (!isIOS()) return false;

  // iOS requires webpage to be added to home screen for notifications
  // We can detect if it's running in standalone mode
  if (isStandalone()) {
    // If running as PWA, we can try to set up notifications
    return true;
  } else {
    // Prompt user to add to home screen
    return false;
  }
};

// Helper for in-app actions to function like notifications when real notifications can't be used
export const simulateNotification = (
  title: string,
  body: string,
  icon?: string,
  onClick?: () => void
): void => {
  // Create an in-app notification element
  const notifContainer = document.createElement('div');
  notifContainer.className = 'fixed top-4 right-4 z-50 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 transform transition-all duration-300 opacity-0 translate-y-4';
  
  // Add content
  notifContainer.innerHTML = `
    <div class="flex gap-3">
      ${icon ? `<img src="${icon}" alt="" class="h-10 w-10 rounded"/>` : ''}
      <div>
        <h4 class="font-semibold text-gray-900 dark:text-white">${title}</h4>
        <p class="text-sm text-gray-700 dark:text-gray-300">${body}</p>
      </div>
      <button class="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white ml-auto">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(notifContainer);
  
  // Show with animation
  setTimeout(() => {
    notifContainer.classList.remove('opacity-0', 'translate-y-4');
  }, 10);
  
  // Add click handler
  if (onClick) {
    notifContainer.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).tagName !== 'BUTTON') {
        onClick();
      }
    });
  }
  
  // Add close handler
  const closeBtn = notifContainer.querySelector('button');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      notifContainer.classList.add('opacity-0', 'translate-y-4');
      setTimeout(() => {
        notifContainer.remove();
      }, 300);
    });
  }
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    notifContainer.classList.add('opacity-0', 'translate-y-4');
    setTimeout(() => {
      notifContainer.remove();
    }, 300);
  }, 5000);
};
