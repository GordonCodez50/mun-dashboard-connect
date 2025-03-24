
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { User, UserRole, UserFormData } from '@/types/auth';

// Auth context type
type AuthContextType = {
  user: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  createUser: (userData: UserFormData) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  isAuthenticated: boolean;
};

// Mock users database - in production this would be stored in a database
const INITIAL_USERS = [
  {
    id: 'chair1',
    username: 'chair',
    password: 'password',
    name: 'John Smith',
    role: 'chair' as UserRole,
    council: 'Security Council',
    email: 'john@example.com',
    createdAt: new Date(2023, 0, 1)
  },
  {
    id: 'admin1',
    username: 'admin',
    password: 'password',
    name: 'Admin User',
    role: 'admin' as UserRole,
    email: 'admin@example.com',
    createdAt: new Date(2023, 0, 1)
  }
];

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use local storage key
const USER_STORAGE_KEY = 'mun_user';
const USERS_STORAGE_KEY = 'mun_users';

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize users from localStorage or defaults
  useEffect(() => {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      try {
        const parsedUsers = JSON.parse(storedUsers);
        // Convert string dates back to Date objects
        const processedUsers = parsedUsers.map((u: any) => ({
          ...u,
          createdAt: new Date(u.createdAt),
          lastLogin: u.lastLogin ? new Date(u.lastLogin) : undefined
        }));
        setUsers(processedUsers);
      } catch (e) {
        console.error('Failed to parse stored users:', e);
        setUsers(INITIAL_USERS);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      }
    } else {
      setUsers(INITIAL_USERS);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Convert string dates back to Date objects
        setUser({
          ...parsedUser,
          createdAt: new Date(parsedUser.createdAt),
          lastLogin: parsedUser.lastLogin ? new Date(parsedUser.lastLogin) : undefined
        });
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    // Simulate network request
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const foundUserWithPassword = users.find(
      user => user.username === username && user.password === password
    );

    if (foundUserWithPassword) {
      // Create user object without password
      const { password: _, ...userWithoutPassword } = foundUserWithPassword;
      
      // Update last login time
      const updatedUser = {
        ...userWithoutPassword,
        lastLogin: new Date()
      };
      
      setUser(updatedUser);
      
      // Update user in users array
      const updatedUsers = users.map(u => 
        u.id === updatedUser.id ? { ...u, lastLogin: updatedUser.lastLogin } : u
      );
      setUsers(updatedUsers);
      
      // Store in localStorage
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      
      // Navigate based on role
      if (updatedUser.role === 'chair') {
        navigate('/chair-dashboard');
        toast.success(`Welcome, ${updatedUser.name}`);
      } else {
        navigate('/admin-panel');
        toast.success(`Welcome, ${updatedUser.name}`);
      }
    } else {
      toast.error('Invalid username or password');
    }
    
    setIsLoading(false);
  };

  // Create user function (admin only)
  const createUser = async (userData: UserFormData): Promise<boolean> => {
    // Validate if username already exists
    if (users.some(u => u.username === userData.username)) {
      toast.error('Username already exists');
      return false;
    }
    
    // Create new user
    const newUser = {
      id: `user${Date.now()}`,
      ...userData,
      createdAt: new Date()
    };
    
    // Add to users array
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    
    // Store in localStorage
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    
    toast.success(`User ${newUser.name} created successfully`);
    return true;
  };
  
  // Delete user function (admin only)
  const deleteUser = async (userId: string): Promise<boolean> => {
    // Cannot delete yourself
    if (user?.id === userId) {
      toast.error('You cannot delete your own account');
      return false;
    }
    
    // Remove from users array
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    
    // Store in localStorage
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    
    toast.success('User deleted successfully');
    return true;
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    navigate('/');
    toast.info('You have been logged out');
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
