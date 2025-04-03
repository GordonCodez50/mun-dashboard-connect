
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { User, UserRole, UserFormData } from '@/types/auth';
import { authService } from '@/services/firebaseService';
import { extractUserInfo } from '@/config/firebaseConfig';

// Auth context type
type AuthContextType = {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  createUser: (userData: UserFormData) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  isAuthenticated: boolean;
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Load users and check authentication state on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Check if user is already logged in
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          
          // Auto-navigate based on role and council
          if (currentUser.role === 'chair') {
            if (currentUser.council && currentUser.council.toUpperCase() === 'PRESS') {
              console.log('Auto-navigating existing press user to press dashboard:', currentUser);
              navigate('/press-dashboard');
            } else {
              navigate('/chair-dashboard');
            }
          } else if (currentUser.role === 'admin') {
            navigate('/admin-panel');
          }
        }
        
        // Load all users for admin functions
        const allUsers = await authService.getUsers();
        setUsers(allUsers);
        
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, [navigate]);

  // Login function
  const login = async (email: string, password: string) => {
    // Simulate network request
    setIsLoading(true);
    
    try {
      const loggedInUser = await authService.signIn(email, password);
      setUser(loggedInUser);
      
      // Reload users list
      const allUsers = await authService.getUsers();
      setUsers(allUsers);
      
      // Navigate based on role and council
      if (loggedInUser.role === 'chair') {
        // Check if the user is press by looking at their council
        // Note: Make this case-insensitive for robustness
        if (loggedInUser.council && loggedInUser.council.toUpperCase() === 'PRESS') {
          console.log('Navigating to press dashboard for user:', loggedInUser);
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
      setIsLoading(false);
    }
  };

  // Create user function (admin only)
  const createUser = async (userData: UserFormData): Promise<boolean> => {
    try {
      const newUser = await authService.createUser(userData);
      
      // Update users list
      setUsers(prev => [...prev, newUser]);
      
      toast.success(`User ${newUser.name} created successfully`);
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
      return false;
    }
  };
  
  // Delete user function (admin only)
  const deleteUser = async (userId: string): Promise<boolean> => {
    // Cannot delete yourself
    if (user?.id === userId) {
      toast.error('You cannot delete your own account');
      return false;
    }
    
    try {
      await authService.deleteUser(userId);
      
      // Update users list
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      toast.success('User deleted successfully');
      return true;
    } catch (error) {
      toast.error('Failed to delete user');
      return false;
    }
  };

  // Logout function
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

  // Return provider
  return (
    <AuthContext.Provider value={{ 
      user, 
      users,
      login, 
      logout,
      createUser,
      deleteUser, 
      isAuthenticated: !!user 
    }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
