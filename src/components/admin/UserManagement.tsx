import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Download, 
  Copy, 
  RefreshCw, 
  Trash2, 
  Eye, 
  EyeOff,
  FileText,
  Upload,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { getUserInfoFromEmail } from '@/utils/user-format';
import { generatePassword } from '@/utils/password-generator';

interface UserEntry {
  id: string;
  email: string;
  password: string;
  role: string;
  username: string;
  council?: string;
  isValid: boolean;
  createdAt: Date;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Load users from localStorage on component mount
  useEffect(() => {
    const savedUsers = localStorage.getItem('admin-users-list');
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        setUsers(parsed.map((user: any) => ({
          ...user,
          createdAt: new Date(user.createdAt)
        })));
      } catch (error) {
        console.error('Error loading saved users:', error);
      }
    }
  }, []);

  // Save users to localStorage whenever users array changes
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('admin-users-list', JSON.stringify(users));
    }
  }, [users]);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addUser = (email: string, password: string = '') => {
    if (!validateEmail(email)) {
      showMessage('error', `Invalid email format: ${email}`);
      return false;
    }

    if (users.find(user => user.email.toLowerCase() === email.toLowerCase())) {
      showMessage('error', `Email already exists: ${email}`);
      return false;
    }

    const userInfo = getUserInfoFromEmail(email);
    const finalPassword = password || generatePassword();
    
    const newUser: UserEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      email: email.toLowerCase(),
      password: finalPassword,
      role: userInfo.role,
      username: userInfo.username,
      council: userInfo.council,
      isValid: true,
      createdAt: new Date()
    };

    setUsers(prev => [...prev, newUser]);
    return true;
  };

  const handleAddUser = () => {
    if (!emailInput.trim()) {
      showMessage('error', 'Please enter an email address');
      return;
    }

    if (addUser(emailInput, passwordInput)) {
      setEmailInput('');
      setPasswordInput('');
      showMessage('success', 'User added successfully');
    }
  };

  const handleBulkAdd = () => {
    if (!bulkEmails.trim()) {
      showMessage('error', 'Please enter email addresses');
      return;
    }

    const emails = bulkEmails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    let addedCount = 0;
    let errorCount = 0;

    emails.forEach(email => {
      if (addUser(email)) {
        addedCount++;
      } else {
        errorCount++;
      }
    });

    setBulkEmails('');
    showMessage('success', `Added ${addedCount} users successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
  };

  const handleDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
    showMessage('info', 'User removed');
  };

  const handleRegeneratePassword = (id: string) => {
    setUsers(prev => prev.map(user => 
      user.id === id 
        ? { ...user, password: generatePassword() }
        : user
    ));
    showMessage('success', 'Password regenerated');
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showMessage('success', `${label} copied to clipboard`);
    } catch (error) {
      showMessage('error', 'Failed to copy to clipboard');
    }
  };

  const exportToCSV = () => {
    if (users.length === 0) {
      showMessage('error', 'No users to export');
      return;
    }

    const csvContent = [
      'Email,Password,Role,Username,Council,Created',
      ...users.map(user => 
        `"${user.email}","${user.password}","${user.role}","${user.username}","${user.council || ''}","${user.createdAt.toISOString()}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('success', 'CSV file downloaded');
  };

  const exportToTXT = () => {
    if (users.length === 0) {
      showMessage('error', 'No users to export');
      return;
    }

    const txtContent = users.map(user => 
      `Email: ${user.email}\nPassword: ${user.password}\nRole: ${user.role}\nUsername: ${user.username}${user.council ? `\nCouncil: ${user.council}` : ''}\n${'='.repeat(50)}`
    ).join('\n\n');

    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('success', 'TXT file downloaded');
  };

  const copyAllUsers = async () => {
    if (users.length === 0) {
      showMessage('error', 'No users to copy');
      return;
    }

    const content = users.map(user => 
      `Email: ${user.email} | Password: ${user.password} | Role: ${user.role} | Username: ${user.username}${user.council ? ` | Council: ${user.council}` : ''}`
    ).join('\n');

    await copyToClipboard(content, 'All users');
  };

  const clearAllUsers = () => {
    if (window.confirm('Are you sure you want to clear all users? This action cannot be undone.')) {
      setUsers([]);
      localStorage.removeItem('admin-users-list');
      showMessage('info', 'All users cleared');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.council && user.council.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'chair': return 'default';
      case 'admin-rt': return 'secondary';
      case 'logistics': return 'outline';
      case 'member-hcc':
      case 'member-fcc': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' && <CheckCircle className="h-4 w-4" />}
          {message.type === 'error' && <AlertCircle className="h-4 w-4" />}
          {message.type === 'info' && <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="add" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="add">Add Users</TabsTrigger>
          <TabsTrigger value="manage">Manage Users ({users.length})</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>
        
        <TabsContent value="add" className="space-y-6">
          {/* Single User Entry */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Individual User
              </CardTitle>
              <CardDescription>
                Add a single user with email and optional custom password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="user@bmunis.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password (optional)</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Leave blank to auto-generate"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPasswordInput(generatePassword())}
                      title="Generate password"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <Button onClick={handleAddUser} className="w-full">
                Add User
              </Button>
            </CardContent>
          </Card>

          {/* Bulk User Entry */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Add Users
              </CardTitle>
              <CardDescription>
                Add multiple users by entering email addresses (one per line)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                placeholder="user1@bmunis.com&#10;user2@bmunis.com&#10;user3@bmunis.com"
                rows={6}
              />
              <Button onClick={handleBulkAdd} className="w-full">
                Add All Users
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage existing users, regenerate passwords, and remove entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search users..."
                      className="pl-10"
                    />
                  </div>
                  {users.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={clearAllUsers}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
                
                {filteredUsers.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Password</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Council</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {showPasswords[user.id] ? user.password : '•'.repeat(9)}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => togglePasswordVisibility(user.id)}
                                >
                                  {showPasswords[user.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(user.role)}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>
                              {user.council && (
                                <Badge variant="outline">{user.council}</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(user.password, 'Password')}
                                  title="Copy password"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRegeneratePassword(user.id)}
                                  title="Regenerate password"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                  title="Remove user"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {users.length === 0 ? 'No users added yet' : 'No users match your search'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export & Download
              </CardTitle>
              <CardDescription>
                Export user list in various formats for external use
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" onClick={exportToCSV} disabled={users.length === 0}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export to CSV
                </Button>
                <Button variant="outline" onClick={exportToTXT} disabled={users.length === 0}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export to TXT
                </Button>
                <Button variant="outline" onClick={copyAllUsers} disabled={users.length === 0}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All to Clipboard
                </Button>
              </div>
              
              {users.length > 0 && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Export Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Users:</span>
                      <div className="font-medium">{users.length}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Admins:</span>
                      <div className="font-medium">{users.filter(u => u.role === 'admin').length}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Chairs:</span>
                      <div className="font-medium">{users.filter(u => u.role === 'chair').length}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Members:</span>
                      <div className="font-medium">{users.filter(u => u.role.includes('member')).length}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};