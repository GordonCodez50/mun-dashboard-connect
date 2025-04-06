import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from "sonner";
import { User, UserRole, UserFormData } from '@/types/auth';
import { 
  UserPlus, 
  UserX, 
  Users, 
  Shield, 
  User as UserIcon, 
  Mail, 
  Building, 
  Key,
  ArrowLeft,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const UserManagement = () => {
  const { user, users, createUser, deleteUser } = useAuth();
  const isMobile = useIsMobile();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserData, setNewUserData] = useState<UserFormData>({
    username: '',
    password: '',
    name: '',
    role: 'chair',
    council: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserData.username || !newUserData.password || !newUserData.name) {
      toast.error('Please fill out all required fields');
      return;
    }
    
    if (newUserData.role === 'chair' && !newUserData.council) {
      toast.error('Chair must be assigned to a council');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await createUser(newUserData);
      if (success) {
        setNewUserData({
          username: '',
          password: '',
          name: '',
          role: 'chair',
          council: '',
          email: ''
        });
        setShowCreateForm(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete ${userName}?`)) {
      await deleteUser(userId);
    }
  };

  // Filter out the current user from the list
  const filteredUsers = users.filter(u => u.id !== user?.id);

  // Mobile-specific UI rendering
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 animate-fade-in">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Link to="/admin-panel" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                <ArrowLeft size={20} className="text-gray-700" />
              </Link>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                User Management
              </h1>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-accent" />
              <h2 className="text-base font-medium text-gray-800">
                Users ({filteredUsers.length})
              </h2>
            </div>
            
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-accent text-white rounded-md hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent button-transition shadow-sm"
            >
              {showCreateForm ? (
                <>
                  <X size={16} />
                  Cancel
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  New User
                </>
              )}
            </button>
          </div>
          
          {showCreateForm && (
            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100 p-4 animate-scale-in">
              <h3 className="text-base font-medium text-primary mb-3">Create New User</h3>
              
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={newUserData.username}
                      onChange={handleInputChange}
                      required
                      className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                      placeholder="Enter username"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={newUserData.password}
                      onChange={handleInputChange}
                      required
                      className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                      placeholder="Enter password"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={newUserData.name}
                      onChange={handleInputChange}
                      required
                      className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                      placeholder="Enter full name"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={newUserData.email}
                      onChange={handleInputChange}
                      className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                      placeholder="Enter email"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield size={16} className="text-gray-400" />
                    </div>
                    <select
                      id="role"
                      name="role"
                      value={newUserData.role}
                      onChange={handleInputChange}
                      required
                      className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                    >
                      <option value="chair">Chair</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                
                {newUserData.role === 'chair' && (
                  <div>
                    <label htmlFor="council" className="block text-sm font-medium text-gray-700 mb-1">
                      Council *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="council"
                        name="council"
                        value={newUserData.council}
                        onChange={handleInputChange}
                        required
                        className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                        placeholder="Enter council name"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent button-transition"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Create User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
            {filteredUsers.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">@{user.username}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700">
                      {user.role === 'chair' ? user.council : user.email || '—'}
                    </p>
                    
                    <div className="mt-2 flex justify-between items-center">
                      <p className="text-xs text-gray-500">
                        {user.lastLogin 
                          ? user.lastLogin.toLocaleDateString() + ' ' + user.lastLogin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Never logged in'
                        }
                      </p>
                      
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center gap-1 text-xs"
                      >
                        <UserX size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-gray-500">
                No users found
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop UI (unchanged)
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 animate-fade-in">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-primary">User Management</h1>
            <p className="text-gray-600 mt-1">
              Create and manage user accounts
            </p>
          </header>
          
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-accent" />
              <h2 className="text-lg font-medium text-primary">
                Users ({filteredUsers.length})
              </h2>
            </div>
            
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent button-transition"
            >
              {showCreateForm ? (
                <>
                  <UserX size={18} />
                  Cancel
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create New User
                </>
              )}
            </button>
          </div>
          
          {showCreateForm && (
            <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-100 p-6 animate-scale-in">
              <h3 className="text-lg font-medium text-primary mb-4">Create New User</h3>
              
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={newUserData.username}
                      onChange={handleInputChange}
                      required
                      className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                      placeholder="Enter username"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={newUserData.password}
                      onChange={handleInputChange}
                      required
                      className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                      placeholder="Enter password"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={newUserData.name}
                      onChange={handleInputChange}
                      required
                      className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                      placeholder="Enter full name"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={newUserData.email}
                      onChange={handleInputChange}
                      className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                      placeholder="Enter email"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield size={16} className="text-gray-400" />
                    </div>
                    <select
                      id="role"
                      name="role"
                      value={newUserData.role}
                      onChange={handleInputChange}
                      required
                      className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                    >
                      <option value="chair">Chair</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                
                {newUserData.role === 'chair' && (
                  <div>
                    <label htmlFor="council" className="block text-sm font-medium text-gray-700 mb-1">
                      Council *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="council"
                        name="council"
                        value={newUserData.council}
                        onChange={handleInputChange}
                        required
                        className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                        placeholder="Enter council name"
                      />
                    </div>
                  </div>
                )}
                
                <div className={newUserData.role === 'chair' ? "md:col-span-2" : "md:col-span-1"}>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent button-transition"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Create User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Council/Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-primary">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{user.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {user.role === 'chair' ? user.council : user.email || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin 
                            ? user.lastLogin.toLocaleDateString() + ' ' + user.lastLogin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Never'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                          >
                            <UserX size={16} />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
