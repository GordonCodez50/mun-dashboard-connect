
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Timer, 
  LogOut, 
  Users,
  UserPlus,
} from 'lucide-react';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const isPress = user?.council === 'PRESS';
  
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 z-10 hidden md:block animate-fade-in">
      <div className="h-full flex flex-col py-6">
        <div className="px-6 mb-8">
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9h.01"></path>
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <circle cx="12" cy="15" r="3"></circle>
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-primary text-center mt-3">MUN Dashboard</h2>
          <p className="text-sm text-gray-500 text-center mt-1 truncate">
            {user?.role === 'admin' ? 'Admin Panel' : user?.council}
          </p>
        </div>
        
        <nav className="flex-1 px-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Main
          </p>
          
          {user?.role === 'chair' && !isPress ? (
            <>
              <NavLink 
                to="/chair-dashboard" 
                className={({ isActive }) => 
                  `flex items-center px-3 py-2 rounded-md mb-1 ${
                    isActive 
                      ? 'bg-accent/10 text-accent' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <LayoutDashboard size={18} className="mr-3" />
                Dashboard
              </NavLink>
              
              <NavLink 
                to="/timer" 
                className={({ isActive }) => 
                  `flex items-center px-3 py-2 rounded-md mb-1 ${
                    isActive 
                      ? 'bg-accent/10 text-accent' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <Timer size={18} className="mr-3" />
                Timer
              </NavLink>
            </>
          ) : isPress ? (
            <NavLink 
              to="/press-dashboard" 
              className={({ isActive }) => 
                `flex items-center px-3 py-2 rounded-md mb-1 ${
                  isActive 
                    ? 'bg-accent/10 text-accent' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <LayoutDashboard size={18} className="mr-3" />
              Press Dashboard
            </NavLink>
          ) : (
            <>
              <NavLink 
                to="/admin-panel" 
                className={({ isActive }) => 
                  `flex items-center px-3 py-2 rounded-md mb-1 ${
                    isActive 
                      ? 'bg-accent/10 text-accent' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <LayoutDashboard size={18} className="mr-3" />
                Dashboard
              </NavLink>
              
              <NavLink 
                to="/user-management" 
                className={({ isActive }) => 
                  `flex items-center px-3 py-2 rounded-md mb-1 ${
                    isActive 
                      ? 'bg-accent/10 text-accent' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <UserPlus size={18} className="mr-3" />
                User Management
              </NavLink>
            </>
          )}
          
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2 mt-6">
            Account
          </p>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 rounded-md mb-1 text-gray-700 hover:bg-gray-100 text-left"
          >
            <LogOut size={18} className="mr-3" />
            Logout
          </button>
        </nav>
        
        <div className="px-3 mt-6">
          <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                {user?.name?.charAt(0)}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
