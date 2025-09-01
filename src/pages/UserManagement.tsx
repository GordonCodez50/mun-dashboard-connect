
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { toast } from "sonner";
import { User, UserRole, UserFormData } from '@/types/auth';
import { authService } from '@/services/firebaseService';
import { 
  Users, 
  Shield, 
  User as UserIcon, 
  HelpCircle,
  ExternalLink,
  Info,
  Check,
  Edit,
  MapPin,
  Building
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useIsMobile } from '@/hooks/use-mobile';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const UserManagement = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editData, setEditData] = useState({ room_no: '', floor_no: '' });
  
  // Filter to show only admin, chair, logistics, and press users
  const filteredUsers = users.filter(u => 
    u.id !== user?.id && 
    ['admin', 'chair', 'logistics', 'press'].includes(u.role)
  );

  // Fetch users from Firebase
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await authService.getUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditLocation = (userId: string, roomNo?: string, floorNo?: string) => {
    setEditingUser(userId);
    setEditData({ 
      room_no: roomNo || '', 
      floor_no: floorNo || '' 
    });
  };

  const handleSaveLocation = async (userId: string) => {
    try {
      const firestore = getFirestore();
      const userRef = doc(firestore, 'users', userId);
      
      await updateDoc(userRef, {
        room_no: editData.room_no || null,
        floor_no: editData.floor_no || null,
      });

      toast.success('Location updated successfully');
      setEditingUser(null);
      
      // Refresh users to get the latest data
      await fetchUsers();
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditData({ room_no: '', floor_no: '' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {!isMobile && <Sidebar />}
      
      <div className={`flex-1 overflow-y-auto transition-all duration-300`}
           style={{ marginLeft: !isMobile ? 'var(--sidebar-width, 256px)' : '0' }}>
        <motion.div 
          className="p-6 md:p-8 animate-fade-in"
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
        >
          <motion.header 
            className="mb-8"
            variants={itemVariants}
          >
            <h1 className="text-3xl font-bold text-primary">User Management</h1>
            <p className="text-gray-600 mt-1">
              View and manage user accounts
            </p>
          </motion.header>
          
          <motion.div 
            className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2">
              <Users size={20} className="text-accent" />
              <h2 className="text-lg font-medium text-primary">
                Users ({filteredUsers.length})
              </h2>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-8"
            variants={itemVariants}
            whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Council / Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
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
                    filteredUsers.map((user, index) => (
                      <motion.tr 
                        key={user.id} 
                        className="hover:bg-gray-50 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        whileHover={{ backgroundColor: "rgba(243, 244, 246, 0.7)" }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-primary">
                            {user.role === 'chair' ? user.council : user.name}
                          </div>
                          {user.role === 'chair' && (
                            <div className="text-xs text-gray-500">{user.name}</div>
                          )}
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
                          {editingUser === user.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Room"
                                value={editData.room_no}
                                onChange={(e) => setEditData(prev => ({ ...prev, room_no: e.target.value }))}
                                className="w-16 px-2 py-1 text-xs border rounded"
                              />
                              <input
                                type="text"
                                placeholder="Floor"
                                value={editData.floor_no}
                                onChange={(e) => setEditData(prev => ({ ...prev, floor_no: e.target.value }))}
                                className="w-16 px-2 py-1 text-xs border rounded"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              {(user as any).room_no || (user as any).floor_no ? (
                                <>
                                  {(user as any).room_no && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                      <Building size={10} />
                                      {(user as any).room_no}
                                    </span>
                                  )}
                                  {(user as any).floor_no && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                      <MapPin size={10} />
                                      Floor {(user as any).floor_no}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-gray-400">Not set</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin 
                            ? user.lastLogin.toLocaleDateString() + ' ' + user.lastLogin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Never'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {editingUser === user.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveLocation(user.id)}
                                className="text-green-600 hover:text-green-700 text-xs px-2 py-1 border border-green-300 rounded hover:bg-green-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-600 hover:text-gray-700 text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            (user.role === 'chair' || user.role === 'logistics') && (
                              <button
                                onClick={() => handleEditLocation(user.id, (user as any).room_no, (user as any).floor_no)}
                                className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50 flex items-center gap-1"
                              >
                                <Edit size={12} />
                                Edit Location
                              </button>
                            )
                          )}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
          
          {/* Troubleshooting Section */}
          <motion.div
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle size={24} className="text-accent" />
              <h2 className="text-lg font-medium text-primary">User Management Troubleshooting</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Follow these steps to add new users to the ISBMUN Dashboard platform through Firebase Authentication.
            </p>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="step-1">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <div className="flex justify-center items-center w-6 h-6 rounded-full bg-accent/10 text-accent">1</div>
                    <span>Access Firebase Console</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-8">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="mb-2">Login to the MUN Firebase account and open the ISBMUN Dashboard <span className="font-semibold text-accent">prod-red</span> project.</p>
                    <div className="flex items-center text-sm text-accent gap-1 hover:underline cursor-pointer">
                      <ExternalLink size={14} />
                      <span>https://console.firebase.google.com</span>
                    </div>
                  </motion.div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="step-2">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <div className="flex justify-center items-center w-6 h-6 rounded-full bg-accent/10 text-accent">2</div>
                    <span>Navigate to Authentication</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-8">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="mb-2">In the Firebase console sidebar, select <span className="font-semibold">Authentication</span>, then click the <span className="font-semibold">Users</span> tab.</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Check size={16} className="text-green-500" />
                      <span>Find "Build" → "Authentication" in the side menu</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={16} className="text-green-500" />
                      <span>Click on the "Users" tab in the Authentication section</span>
                    </div>
                  </motion.div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="step-3">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <div className="flex justify-center items-center w-6 h-6 rounded-full bg-accent/10 text-accent">3</div>
                    <span>Add a New User</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-8">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="mb-2">Click the <span className="font-semibold">Add User</span> button and fill in the required information:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-3 text-sm text-gray-600">
                      <li><span className="font-medium text-gray-700">Email:</span> Use the username@bmunis.com format or a valid email</li>
                      <li><span className="font-medium text-gray-700">Password:</span> Enter a secure temporary password (min. 6 characters)</li>
                    </ul>
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                      <div className="flex items-start gap-2">
                        <Info size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Important:</p> 
                          <p>After creating the user, you'll need to manually update the Firestore database to add role, council, and other user details.</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="step-4">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <div className="flex justify-center items-center w-6 h-6 rounded-full bg-accent/10 text-accent">4</div>
                    <span>Update User Details in Firestore</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-8">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="mb-3">Navigate to the <span className="font-semibold">Firestore Database</span> section in Firebase and update the user document:</p>
                    <ol className="list-decimal pl-6 space-y-2 text-sm text-gray-600">
                      <li>Go to the <span className="font-medium text-gray-700">users</span> collection</li>
                      <li>Find the document with the matching user ID (same as Authentication UID)</li>
                      <li>Add or modify these fields:</li>
                    </ol>
                    <div className="bg-gray-50 p-3 mt-2 mb-3 rounded border border-gray-200 font-mono text-sm">
                      <div><span className="text-pink-600">name</span>: <span className="text-green-600">"User's Full Name"</span>,</div>
                      <div><span className="text-pink-600">role</span>: <span className="text-green-600">"chair"</span> <span className="text-gray-500">// or "admin"</span>,</div>
                      <div><span className="text-pink-600">council</span>: <span className="text-green-600">"Council Name"</span> <span className="text-gray-500">// for chair role</span>,</div>
                      <div><span className="text-pink-600">email</span>: <span className="text-green-600">"user@example.com"</span>,</div>
                      <div><span className="text-pink-600">createdAt</span>: <span className="text-blue-600">timestamp</span>,</div>
                      <div><span className="text-pink-600">username</span>: <span className="text-green-600">"username"</span></div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                      <div className="flex items-start gap-2">
                        <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Tip:</p>
                          <p>Use meaningful usernames like "chair_unsc" for easier identification. The username field should match what the user will use to log in.</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="step-5">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <div className="flex justify-center items-center w-6 h-6 rounded-full bg-accent/10 text-accent">5</div>
                    <span>Verify User Access</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-8">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="mb-2">Once created, the user should appear in the platform's user management list and be able to log in with their credentials.</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Check size={16} className="text-green-500" />
                      <span>Ask the user to test logging in with their new credentials</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm">
                      <p className="font-medium text-gray-700 mb-1">Users created in Firebase will have these capabilities:</p>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        <li><span className="font-medium">Chair users:</span> Access to their council dashboard</li>
                        <li><span className="font-medium">Admin users:</span> Full access to all platform features</li>
                      </ul>
                    </div>
                  </motion.div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserManagement;
