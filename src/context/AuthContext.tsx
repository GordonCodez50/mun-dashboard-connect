
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

// User roles
export type UserRole = 'chair' | 'admin';

// User type
export type User = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  council?: string; // For chairs
};

// Auth context type
type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

// Mock users database
const MOCK_USERS = [
  {
    id: 'chair1',
    username: 'chair',
    password: 'password',
    name: 'John Smith',
    role: 'chair' as UserRole,
    council: 'Security Council'
  },
  {
    id: 'admin1',
    username: 'admin',
    password: 'password',
    name: 'Admin User',
    role: 'admin' as UserRole
  }
];

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('mun_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    // Simulate network request
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const foundUser = MOCK_USERS.find(
      user => user.username === username && user.password === password
    );

    if (foundUser) {
      // Create user object without password
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      
      // Store in localStorage
      localStorage.setItem('mun_user', JSON.stringify(userWithoutPassword));
      
      // Navigate based on role
      if (userWithoutPassword.role === 'chair') {
        navigate('/chair-dashboard');
        toast.success(`Welcome, ${userWithoutPassword.name}`);
      } else {
        navigate('/admin-panel');
        toast.success(`Welcome, ${userWithoutPassword.name}`);
      }
    } else {
      toast.error('Invalid username or password');
    }
    
    setIsLoading(false);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('mun_user');
    navigate('/');
    toast.info('You have been logged out');
  };

  // Return provider
  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
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
