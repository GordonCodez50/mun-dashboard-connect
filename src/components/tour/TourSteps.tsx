import { StepType } from '@reactour/tour';
import { useTourContext } from '@/context/TourContext';
import { useNavigate } from 'react-router-dom';

export const useTourSteps = (): StepType[] => {
  const { createMockAlert, createDummyParticipants, stopTour } = useTourContext();
  const navigate = useNavigate();

  return [
    // Dashboard Steps
    {
      selector: '[data-tour="quick-actions"]',
      content: 'Use these buttons to quickly notify the admin for common issues like a technical glitch, insufficient resources.',
      position: 'bottom',
      action: () => {
        // Ensure we're on dashboard
        if (window.location.pathname !== '/chair/dashboard') {
          navigate('/chair/dashboard');
        }
      }
    },
    {
      selector: '[data-tour="custom-message"]',
      content: 'Need to say something else? Use this box to type your custom message to the admin team.',
      position: 'top'
    },
    {
      selector: '[data-tour="timer-widget"]',
      content: 'This timer is your best friend during debates. Use it to time speeches, caucuses, and more.',
      position: 'top'
    },
    {
      selector: '[data-tour="alerts-section"]',
      content: 'This section shows alerts or responses sent by the admin. You\'ll see critical updates here.',
      position: 'top',
      action: async () => {
        // Create mock alert for demonstration
        await createMockAlert();
      }
    },
    {
      selector: '[data-tour="alerts-section"]',
      content: 'Notice the demo alert that just appeared? You can acknowledge or reply to alerts like this one. Try clicking on it!',
      position: 'top'
    },
    // Timer Page Steps
    {
      selector: 'body',
      content: 'Now let\'s explore the Timer page. The timer here works exactly like before, but with more control.',
      position: 'center',
      action: () => {
        navigate('/timer-manager');
      }
    },
    {
      selector: '[data-tour="add-timer-btn"]',
      content: 'You can add multiple timers here for separate uses.',
      position: 'bottom'
    },
    {
      selector: '[data-tour="timer-presets"]',
      content: 'Choose from presets like 1 Min, 5 Mins etc.',
      position: 'top'
    },
    {
      selector: '[data-tour="timer-label"]',
      content: 'Click the timer title to rename it for clarity.',
      position: 'bottom'
    },
    // Attendance Page Steps
    {
      selector: 'body',
      content: 'Next, let\'s check out the Attendance page.',
      position: 'center',
      action: () => {
        navigate('/chair/attendance');
      }
    },
    {
      selector: '[data-tour="manage-participants-tab"]',
      content: 'Here\'s where you add individual delegates. Let me show you by creating some demo participants.',
      position: 'bottom',
      action: async () => {
        // Switch to manage participants tab
        const manageTab = document.querySelector('[data-tour="manage-participants-tab"]') as HTMLButtonElement;
        if (manageTab) {
          manageTab.click();
        }
        // Create dummy participants
        await createDummyParticipants();
      }
    },
    {
      selector: '[data-tour="track-attendance-tab"]',
      content: 'Switch to today\'s date and begin marking attendance.',
      position: 'bottom',
      action: () => {
        // Switch to track attendance tab
        const trackTab = document.querySelector('[data-tour="track-attendance-tab"]') as HTMLButtonElement;
        if (trackTab) {
          trackTab.click();
        }
      }
    },
    {
      selector: '[data-tour="attendance-marking"]',
      content: 'Click to mark individual participants as present or absent. Mostly participants will already be added, use this only when you see a participant missing in database.',
      position: 'top'
    },
    {
      selector: '[data-tour="submit-attendance"]',
      content: 'Make sure to submit attendance after you\'re done.',
      position: 'top'
    },
    // File Sharing Page Steps
    {
      selector: 'body',
      content: 'Now let\'s explore File Sharing.',
      position: 'center',
      action: () => {
        navigate('/chair/files');
      }
    },
    {
      selector: '[data-tour="file-mode-tabs"]',
      content: 'You can switch between Printing mode and Custom sharing.',
      position: 'bottom'
    },
    {
      selector: '[data-tour="upload-button"]',
      content: 'Upload draft resolutions, working papers, etc. here.',
      position: 'top'
    },
    {
      selector: '[data-tour="files-display"]',
      content: 'Your uploaded files and those sent by admins will appear here.',
      position: 'top'
    },
    // Resources Page Step
    {
      selector: '[data-tour="resources-link"]',
      content: 'Click here to access all essential resources shared for your council.',
      position: 'right',
      action: () => {
        navigate('/chair/dashboard');
      }
    },
    // Final Step
    {
      selector: 'body',
      content: 'Congratulations! You\'ve completed the dashboard tour. All demo data will now be cleaned up automatically. Welcome to your Chair Dashboard!',
      position: 'center',
      action: async () => {
        await stopTour();
      }
    }
  ];
};