
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { User, UserRole, UserFormData } from '@/types/auth';
import { authService } from '@/services/firebaseService';
import { notificationService } from '@/services/notificationService';
import { realtimeService } from '@/services/realtimeService';
import { getUserInfoFromEmail } from '@/utils/user-format';

type AuthContextType = {
  user: User | null;
  users: User[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  createUser: (userData: UserFormData) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  isAuthenticated: boolean;
  showNotificationPrompt: boolean;
  requestNotificationPermission: () => Promise<boolean>;
  permissionGranted: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to convert UserRole to notification service role type
const mapRoleForNotifications = (role: UserRole, council?: string): 'admin' | 'chair' | 'press' => {
  if (role === 'admin') return 'admin';
  if (council === 'PRESS') return 'press';
  return 'chair';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [permissionPromptShown, setPermissionPromptShown] = useState(false);
  const navigate = useNavigate();

  // Initialize notification service and alert listeners
  useEffect(() => {
    // Ensure global alert listeners are initialized
    realtimeService.initializeAlertListeners();
    
    // Restore notification service user role if available
    notificationService.restoreUserRole();
    
    // Check if alert listeners are active, if not, reinitialize them
    if (!realtimeService.areAlertListenersActive()) {
      console.log('Alert listeners not active, reinitializing...');
      realtimeService.reinitializeAlertListeners();
    }
  }, []);

  useEffect(() => {
    const checkNotifications = () => {
      if (notificationService.isNotificationSupported()) {
        const hasPermission = notificationService.hasPermission();
        setPermissionGranted(hasPermission);
      }
      setPermissionChecked(true);
    };
    
    checkNotifications();
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          
          // Set user role for notification service when restoring session
          const notificationRole = mapRoleForNotifications(currentUser.role, currentUser.council);
          notificationService.setUserRole(notificationRole);
          
          // If we have a service worker, send user role to it as well
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SET_USER_ROLE',
              role: notificationRole
            });
          }
        }
        
        try {
          const allUsers = await authService.getUsers();
          setUsers(allUsers);
        } catch (error) {
          console.info('Permission denied when fetching users. This is expected for non-admin users.');
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const granted = await notificationService.requestPermission();
      setPermissionGranted(granted);
      setPermissionPromptShown(true);
      
      if (granted && user) {
        // Set user role again after permission granted
        const notificationRole = mapRoleForNotifications(user.role, user.council);
        notificationService.setUserRole(notificationRole);
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const loggedInUser = await authService.signIn(email, password);
      setUser(loggedInUser);
      
      try {
        const allUsers = await authService.getUsers();
        setUsers(allUsers);
      } catch (error) {
        console.info('Permission denied when fetching users. This is expected for non-admin users.');
      }
      
      // Map user role for notifications
      const notificationRole = mapRoleForNotifications(loggedInUser.role, loggedInUser.council);
      
      // Set user role for notifications
      notificationService.setUserRole(notificationRole);
      
      // Also inform service worker about user role
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SET_USER_ROLE',
          role: notificationRole
        });
      }
      
      // Make sure that alert listeners are registered
      realtimeService.initializeAlertListeners();
      
      // Navigate based on user role
      if (loggedInUser.role === 'chair') {
        if (loggedInUser.council === 'PRESS') {
          navigate('/press-dashboard');
          toast.success(`Welcome, ${loggedInUser.name}`);
        } else {
          navigate('/chair-dashboard');
          toast.success(`Welcome, ${loggedInUser.name}`);
        }
      } else {
        navigate('/admin-panel');
        toast.success(`Welcome, ${loggedInUser.name}`);
      }
      
      // Request notification permission after login if not already granted
      if (notificationService.isNotificationSupported() && !notificationService.hasPermission()) {
        // Wait a bit before showing the permission prompt
        setTimeout(() => {
          requestNotificationPermission();
        }, 2000);
      }
    } catch (error: any) {
      toast.error(error.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: UserFormData): Promise<boolean> => {
    try {
      const newUser = await authService.createUser(userData);
      
      setUsers(prev => [...prev, newUser]);
      
      toast.success(`User ${newUser.name} created successfully`);
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
      return false;
    }
  };
  
  const deleteUser = async (userId: string): Promise<boolean> => {
    if (user?.id === userId) {
      toast.error('You cannot delete your own account');
      return false;
    }
    
    try {
      await authService.deleteUser(userId);
      
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      toast.success('User deleted successfully');
      return true;
    } catch (error) {
      toast.error('Failed to delete user');
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      
      // Remove role from notification service
      notificationService.setUserRole('admin'); // Set to a default role
      
      navigate('/');
      toast.info('You have been logged out');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const showNotificationPrompt = permissionChecked && 
                                !permissionGranted && 
                                !permissionPromptShown &&
                                notificationService.isNotificationSupported() && 
                                user !== null && 
                                (user?.role === 'chair' || user?.council === 'PRESS');

  return (
    <AuthContext.Provider value={{ 
      user, 
      users,
      loading,
      login, 
      logout,
      createUser,
      deleteUser, 
      isAuthenticated: !!user,
      showNotificationPrompt,
      requestNotificationPermission,
      permissionGranted
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
