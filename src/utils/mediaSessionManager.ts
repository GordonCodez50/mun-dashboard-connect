/**
 * Media Session Manager
 * Prevents unwanted lock screen media widgets by only activating when actual media is playing
 */

let isMediaActivelyPlaying = false;
let currentMediaElement: HTMLAudioElement | null = null;

/**
 * Initialize media session only when media is actively being used
 */
export const initializeMediaSession = (title: string, artist: string = 'MUN Dashboard') => {
  if (!('mediaSession' in navigator)) {
    console.log('Media Session API not supported');
    return;
  }

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      artwork: [
        { src: '/logo.png', sizes: '96x96', type: 'image/png' },
        { src: '/logo.png', sizes: '128x128', type: 'image/png' },
        { src: '/logo.png', sizes: '192x192', type: 'image/png' },
        { src: '/logo.png', sizes: '256x256', type: 'image/png' },
        { src: '/logo.png', sizes: '384x384', type: 'image/png' },
        { src: '/logo.png', sizes: '512x512', type: 'image/png' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    navigator.mediaSession.setActionHandler('stop', clearMediaSession);
  } catch (error) {
    console.error('Error setting up media session:', error);
  }
};

/**
 * Clear media session metadata to remove lock screen widget
 */
export const clearMediaSession = () => {
  if (!('mediaSession' in navigator)) return;

  try {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    navigator.mediaSession.setActionHandler('stop', null);
    
    isMediaActivelyPlaying = false;
    currentMediaElement = null;
    
    console.log('Media session cleared');
  } catch (error) {
    console.error('Error clearing media session:', error);
  }
};

/**
 * Play notification sound with controlled media session
 */
export const playManagedNotificationSound = async (soundPath: string = '/ringtonenotification.mp3'): Promise<boolean> => {
  try {
    // Clear any existing media session first
    clearMediaSession();
    
    // Create audio element
    const audio = new Audio(soundPath);
    audio.volume = 0.7;
    
    // Set up event handlers before playing
    return new Promise((resolve) => {
      const handleEnded = () => {
        // Clear media session when sound finishes
        clearMediaSession();
        cleanup();
        resolve(true);
      };

      const handleError = (error: Event) => {
        console.error('Audio playback error:', error);
        clearMediaSession();
        cleanup();
        resolve(false);
      };

      const cleanup = () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        if (currentMediaElement === audio) {
          currentMediaElement = null;
        }
      };

      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      
      // Only initialize media session when sound starts playing
      audio.addEventListener('play', () => {
        isMediaActivelyPlaying = true;
        currentMediaElement = audio;
        initializeMediaSession('Notification Sound', 'MUN Dashboard');
      }, { once: true });

      // Start playing
      audio.play().catch(error => {
        console.error('Failed to play notification sound:', error);
        cleanup();
        resolve(false);
      });
    });
  } catch (error) {
    console.error('Error in managed notification sound:', error);
    clearMediaSession();
    return false;
  }
};

/**
 * Check if media is currently actively playing
 */
export const isMediaPlaying = (): boolean => {
  return isMediaActivelyPlaying;
};

/**
 * Get current media element
 */
export const getCurrentMediaElement = (): HTMLAudioElement | null => {
  return currentMediaElement;
};

/**
 * Stop any currently playing media and clear session
 */
export const stopAllMedia = () => {
  if (currentMediaElement) {
    currentMediaElement.pause();
    currentMediaElement.currentTime = 0;
  }
  clearMediaSession();
};