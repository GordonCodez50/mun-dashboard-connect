
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { User, UserRole, UserFormData } from '@/types/auth';
import { authService } from '@/services/firebaseService';
import { extractUserInfo } from '@/config/firebaseConfig';
import { notificationService } from '@/services/notificationService';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [permissionPromptShown, setPermissionPromptShown] = useState(false);
  const navigate = useNavigate();

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
        }
        
        const allUsers = await authService.getUsers();
        setUsers(allUsers);
        
        if (user) {
          // Fix: Convert UserRole to accepted string values for notification service
          if (user.role === 'admin') {
            notificationService.setUserRole('admin');
          } else if (user.role === 'chair') {
            notificationService.setUserRole('chair');
          } else if (user.council === 'PRESS') {
            notificationService.setUserRole('press');
          }
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
      
      const allUsers = await authService.getUsers();
      setUsers(allUsers);
      
      // Set user role for notifications
      if (loggedInUser.role === 'admin') {
        notificationService.setUserRole('admin');
      } else if (loggedInUser.role === 'chair') {
        if (loggedInUser.council === 'PRESS') {
          notificationService.setUserRole('press');
        } else {
          notificationService.setUserRole('chair');
        }
      }
      
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
