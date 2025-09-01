import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { realtimeService } from '@/services/firebaseService';
import { useNavigate, useLocation } from 'react-router-dom';
import { useParticipantOperations } from '@/hooks/useParticipantOperations';
import { ParticipantWithAttendance } from '@/types/attendance';

interface TourContextType {
  startTour: () => void;
  stopTour: () => void;
  isTourActive: boolean;
  currentStep: number;
  createMockAlert: () => Promise<void>;
  createDummyParticipants: () => Promise<void>;
  cleanupTourData: () => Promise<void>;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTourContext = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTourContext must be used within a TourProvider');
  }
  return context;
};

interface TourContextProviderProps {
  children: React.ReactNode;
}

export const TourContextProvider: React.FC<TourContextProviderProps> = ({ children }) => {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addParticipant, deleteParticipant } = useParticipantOperations();
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [mockAlertId, setMockAlertId] = useState<string | null>(null);
  const [dummyParticipantIds, setDummyParticipantIds] = useState<string[]>([]);

  // Check if user should see tour - prioritize database value over localStorage
  useEffect(() => {
    if (user?.role === 'chair' && location.pathname === '/chair/dashboard') {
      // Check if tour has been completed (database value takes precedence)
      const hasCompletedTour = user.hasCompletedTour || 
        (user.username && localStorage.getItem(`tour_completed_${user.username}`) === 'true');
      
      if (!hasCompletedTour) {
        // Small delay to ensure page is loaded
        setTimeout(() => {
          setIsTourActive(true);
          setCurrentStep(0);
        }, 1500); // Increased delay to ensure proper loading
      }
    }
  }, [user, location.pathname]);

  const createMockAlert = async () => {
    // Demo alerts completely disabled for production
    console.log('Demo alert creation permanently disabled');
  };

  const createDummyParticipants = async () => {
    if (!user?.council) return;

    try {
      const dummyParticipants: Omit<ParticipantWithAttendance, 'id'>[] = [
        { 
          name: 'Test Delegate 1', 
          council: user.council || 'Unknown',
          role: 'delegate' as const,
          attendance: {
            day1: 'absent' as const,
            day2: 'absent' as const
          }
        },
        { 
          name: 'Test Delegate 2', 
          council: user.council || 'Unknown',
          role: 'delegate' as const,
          attendance: {
            day1: 'absent' as const,
            day2: 'absent' as const
          }
        },
        { 
          name: 'Test Delegate 3', 
          council: user.council || 'Unknown',
          role: 'delegate' as const,
          attendance: {
            day1: 'absent' as const,
            day2: 'absent' as const
          }
        }
      ];

      const createdIds: string[] = [];
      
      for (const participant of dummyParticipants) {
        const id = await addParticipant(participant);
        createdIds.push(id);
      }
      
      setDummyParticipantIds(createdIds);
      
      toast.info('Demo participants created for tour', {
        description: 'These will be cleaned up automatically',
        duration: 3000
      });
    } catch (error) {
      console.error('Error creating dummy participants:', error);
    }
  };

  const cleanupTourData = async () => {
    try {
      // Clean up mock alert (just clear the ID since it's temporary)
      setMockAlertId(null);

      // Clean up dummy participants
      for (const participantId of dummyParticipantIds) {
        await deleteParticipant(participantId);
      }
      setDummyParticipantIds([]);

      // Mark tour as completed in database and localStorage
      if (user?.id) {
        try {
          // Update in Supabase profiles table
          await updateUserProfile({ hasCompletedTour: true });
          
          toast.success('Tour completed! Welcome to the dashboard.', {
            description: 'All demo data has been cleaned up.',
            duration: 5000
          });
        } catch (error) {
          console.error('Error updating tour completion:', error);
          // Fallback to localStorage if database update fails
          if (user?.username) {
            localStorage.setItem(`tour_completed_${user.username}`, 'true');
          }
          toast.success('Tour completed! Welcome to the dashboard.', {
            description: 'All demo data has been cleaned up.',
            duration: 5000
          });
        }
      }
    } catch (error) {
      console.error('Error cleaning up tour data:', error);
      toast.error('Error cleaning up tour data');
    }
  };

  const startTour = () => {
    setIsTourActive(true);
    setCurrentStep(0);
  };

  const stopTour = async () => {
    setIsTourActive(false);
    await cleanupTourData();
  };

  const value: TourContextType = {
    startTour,
    stopTour,
    isTourActive,
    currentStep,
    createMockAlert,
    createDummyParticipants,
    cleanupTourData
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
};