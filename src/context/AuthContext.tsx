
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { User, UserRole, UserFormData } from '@/types/auth';
import { authService } from '@/services/firebaseService';
import { 
  initializeCrossPlatformNotifications,
  setUserRole,
  restoreUserRole,
  requestNotificationPermission,
  hasNotificationPermission
} from '@/services/crossPlatformNotificationManager';
import { realtimeService } from '@/services/firebaseService';
import { auditLogService } from '@/services/auditLogService';
import { getUserInfoFromEmail } from '@/utils/user-format';
import { supabase } from '@/integrations/supabase/client';

type AuthContextType = {
  user: User | null;
  users: User[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  createUser: (userData: UserFormData) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  refreshUsers: () => Promise<void>;
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
  
  // Mobile-specific timeout handling
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      // Shorter timeout for mobile to prevent blank screens
      const mobileTimeout = setTimeout(() => {
        if (loading) {
          setLoading(false);
          console.log('Mobile auth timeout reached, allowing app to render');
        }
      }, 3000); // 3 second timeout for mobile
      
      return () => clearTimeout(mobileTimeout);
    }
  }, [loading]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [permissionPromptShown, setPermissionPromptShown] = useState(false);
  const navigate = useNavigate();

  // Initialize cross-platform notification system and alert listeners
  useEffect(() => {
    const initializeNotificationSystem = async () => {
      console.log('Initializing cross-platform notification system...');
      
      // Initialize cross-platform notifications
      const result = await initializeCrossPlatformNotifications();
      console.log('Notification system initialization result:', result);
      
      // Restore user role if available
      restoreUserRole();
      
      // Ensure global alert listeners are initialized
      realtimeService.initializeAlertListeners();
      
      // Check if alert listeners are active, if not, reinitialize them
      if (!realtimeService.areAlertListenersActive()) {
        console.log('Alert listeners not active, reinitializing...');
        realtimeService.reinitializeAlertListeners();
      }
    };
    
    initializeNotificationSystem();
  }, []);

  useEffect(() => {
    const checkNotifications = () => {
      const hasPermission = hasNotificationPermission();
      setPermissionGranted(hasPermission);
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
          
          // Set user role for cross-platform notification system
          const notificationRole = mapRoleForNotifications(currentUser.role, currentUser.council);
          setUserRole(notificationRole);
        }
        
        try {
          await refreshUsers();
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

  const requestNotificationPermissionContext = async () => {
    try {
      const result = await requestNotificationPermission();
      setPermissionGranted(result.granted);
      setPermissionPromptShown(true);
      
      if (result.granted && user) {
        // Set user role again after permission granted
        const notificationRole = mapRoleForNotifications(user.role, user.council);
        setUserRole(notificationRole);
      }
      
      if (result.error) {
        console.error('Notification permission error:', result.error);
      }
      
      return result.granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Log login attempt
      auditLogService.logAuthAttempt(email, false, 'Login attempt initiated');
      
      const loggedInUser = await authService.signIn(email, password);
      
      // Sync user profile to Supabase (consistent ID-based approach)
      try {
        console.log('Syncing Firebase user to Supabase profile:', { 
          id: loggedInUser.id, 
          username: loggedInUser.username,
          role: loggedInUser.role,
          council: loggedInUser.council,
          email: loggedInUser.email
        });

        // First, check if profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('has_completed_tour, id')
          .eq('id', loggedInUser.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching existing profile:', fetchError);
        }

        // Use existing tour status or default to false
        const hasCompletedTour = existingProfile?.has_completed_tour || false;
        loggedInUser.hasCompletedTour = hasCompletedTour;

        if (existingProfile) {
          // Profile exists, update it
          console.log('Updating existing profile for user:', loggedInUser.id);
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              username: loggedInUser.username,
              name: loggedInUser.name,
              role: loggedInUser.role,
              council: loggedInUser.council,
              email: loggedInUser.email,
              last_login: new Date().toISOString()
            })
            .eq('id', loggedInUser.id);

          if (updateError) {
            console.error('Error updating existing profile:', updateError);
          } else {
            console.log('Successfully updated existing profile');
          }
        } else {
          // Profile doesn't exist, create it
          console.log('Creating new profile for user:', loggedInUser.id);
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: loggedInUser.id,
              username: loggedInUser.username,
              name: loggedInUser.name,
              role: loggedInUser.role,
              council: loggedInUser.council,
              email: loggedInUser.email,
              has_completed_tour: hasCompletedTour,
              last_login: new Date().toISOString()
            });

          if (insertError) {
            console.error('Error creating new profile:', insertError);
            
            // If insert fails, try upsert as fallback
            console.log('Trying upsert as fallback...');
            const { error: upsertError } = await supabase
              .from('profiles')
              .upsert({
                id: loggedInUser.id,
                username: loggedInUser.username,
                name: loggedInUser.name,
                role: loggedInUser.role,
                council: loggedInUser.council,
                email: loggedInUser.email,
                has_completed_tour: hasCompletedTour,
                last_login: new Date().toISOString()
              });

            if (upsertError) {
              console.error('Error with upsert fallback:', upsertError);
            } else {
              console.log('Successfully created profile via upsert fallback');
            }
          } else {
            console.log('Successfully created new profile');
          }
        }
      } catch (error) {
        console.error('Error syncing profile to Supabase:', error);
        // Set default value if Supabase sync fails completely
        loggedInUser.hasCompletedTour = false;
      }

      setUser(loggedInUser);
      
      // Log successful login
      auditLogService.logAuthAttempt(loggedInUser.username, true, `Successful login for ${loggedInUser.role} user`);
      
      try {
        await refreshUsers();
      } catch (error) {
        console.info('Permission denied when fetching users. This is expected for non-admin users.');
      }
      
      // Set user role for cross-platform notification system
      const notificationRole = mapRoleForNotifications(loggedInUser.role, loggedInUser.council);
      setUserRole(notificationRole);
      
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
        // Role-based navigation for non-chair users
        switch (loggedInUser.role) {
          case 'admin':
            navigate('/admin-panel');
            break;
          case 'admin-rt':
            navigate('/rt-admin-dashboard');
            break;
          case 'logistics':
            navigate('/logistics-dashboard');
            break;
          case 'member-hcc':
          case 'member-fcc':
            navigate('/member-dashboard');
            break;
          default:
            navigate('/admin-panel');
        }
        toast.success(`Welcome, ${loggedInUser.name}`);
      }
      
      // Request notification permission after login if not already granted
      if (!hasNotificationPermission()) {
        // Wait a bit before showing the permission prompt
        setTimeout(() => {
          requestNotificationPermissionContext();
        }, 2000);
      }
    } catch (error: any) {
      // Log failed login
      auditLogService.logAuthAttempt(email, false, `Login failed: ${error.message || 'Unknown error'}`);
      toast.error(error.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: UserFormData): Promise<boolean> => {
    try {
      const newUser = await authService.createUser(userData);
      
      setUsers(prev => [...prev, newUser]);
      
      // Log user creation
      if (user) {
        auditLogService.logUserCreated(newUser, user);
      }
      
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
      // Find user info before deletion for logging
      const userToDelete = users.find(u => u.id === userId);
      
      await authService.deleteUser(userId);
      
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      // Log user deletion
      if (user && userToDelete) {
        auditLogService.logUserDeleted(userId, userToDelete.username, user);
      }
      
      toast.success('User deleted successfully');
      return true;
    } catch (error) {
      toast.error('Failed to delete user');
      return false;
    }
  };

  const refreshUsers = async () => {
    try {
      // Get users from Firestore instead of Supabase
      const firestoreUsers = await authService.getUsers();
      
      const usersData = firestoreUsers.map((user: any) => ({
        id: user.id,
        username: user.username || '',
        name: user.name || '',
        role: user.role as UserRole,
        council: user.council,
        email: user.email,
        createdAt: user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt || Date.now()),
        lastLogin: user.lastLogin?.toDate ? user.lastLogin.toDate() : user.lastLogin ? new Date(user.lastLogin) : undefined,
        hasCompletedTour: user.hasCompletedTour || false,
        room_no: user.room_no,
        floor_no: user.floor_no,
      }));
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error refreshing users from Firestore:', error);
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      // Update in Supabase profiles table using consistent ID-based approach
      console.log('Updating profile in Supabase for user ID:', user.id);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          username: updates.username,
          name: updates.name,
          role: updates.role,
          council: updates.council,
          email: updates.email,
          has_completed_tour: updates.hasCompletedTour,
          last_login: updates.lastLogin?.toISOString()
        })
        .eq('id', user.id); // Use Firebase ID consistently

      if (error) {
        console.error('Error updating user profile in Supabase:', error);
      } else {
        console.log('Successfully updated profile in Supabase');
      }

      // Update local user state
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  };

  const logout = async () => {
    try {
      // Log logout if user exists
      if (user) {
        auditLogService.logLogout(user);
      }
      
      await authService.signOut();
      setUser(null);
      
      // Remove role from notification service
      setUserRole('admin'); // Set to a default role
      
      navigate('/');
      toast.info('You have been logged out');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const showNotificationPrompt = permissionChecked && 
                                !permissionGranted && 
                                !permissionPromptShown &&
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
      updateUserProfile,
      refreshUsers,
      isAuthenticated: !!user,
      showNotificationPrompt,
      requestNotificationPermission: requestNotificationPermissionContext,
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
