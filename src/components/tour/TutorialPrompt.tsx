import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserDataCheck } from '@/hooks/useUserDataCheck';
import { useTourContext } from '@/context/TourContext';
import { TutorialPopup } from './TutorialPopup';
import { useLocation } from 'react-router-dom';

export const TutorialPrompt: React.FC = () => {
  const { user } = useAuth();
  const { hasData, loading } = useUserDataCheck();
  const { startTour } = useTourContext();
  const location = useLocation();
  const [showPopup, setShowPopup] = useState(false);
  const [sessionPopupShown, setSessionPopupShown] = useState(false);

  useEffect(() => {
    // Check session storage for this session
    const sessionKey = user?.id ? `tutorial_shown_session_${user.id}` : null;
    const shownThisSession = sessionKey ? sessionStorage.getItem(sessionKey) === 'true' : false;
    
    // Only show for chair or press users on dashboard pages who have no data, haven't completed tour, and haven't seen it this session
    if (
      (user?.role === 'chair' || user?.council === 'PRESS') && 
      (location.pathname === '/chair-dashboard' || location.pathname === '/press-dashboard') &&
      !loading && 
      hasData === false && 
      user?.hasCompletedTour !== true && // Check database field
      !sessionPopupShown &&
      !shownThisSession
    ) {
      // Small delay to ensure page is loaded
      setTimeout(() => {
        setShowPopup(true);
        setSessionPopupShown(true);
        if (sessionKey) {
          sessionStorage.setItem(sessionKey, 'true');
        }
      }, 1500);
    }
  }, [user, hasData, loading, location.pathname, sessionPopupShown]);

  const handleStartTour = () => {
    setShowPopup(false);
    startTour();
  };

  const handleSkip = () => {
    setShowPopup(false);
    // Mark as if they completed tour to not show again
    if (user?.username) {
      localStorage.setItem(`tutorial_skipped_${user.username}`, 'true');
    }
  };

  // Reset session popup status when user changes
  useEffect(() => {
    if (user) {
      // Check database field first, then fallback to localStorage
      const hasCompletedTour = user.hasCompletedTour || 
        (user.username && localStorage.getItem(`tutorial_skipped_${user.username}`) === 'true');
      if (hasCompletedTour) {
        setSessionPopupShown(true);
      } else {
        setSessionPopupShown(false);
      }
    }
  }, [user]);

  return (
    <TutorialPopup
      isOpen={showPopup}
      onStartTour={handleStartTour}
      onSkip={handleSkip}
      userName={user?.name}
    />
  );
};