
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoExists, setLogoExists] = useState(false);
  const { login, isAuthenticated, user } = useAuth();

  // Check if custom logo exists
  useEffect(() => {
    const checkLogoExists = async () => {
      try {
        const response = await fetch('/logo.png');
        setLogoExists(response.ok);
      } catch (error) {
        console.error('Error checking for logo:', error);
        setLogoExists(false);
      }
    };
    
    checkLogoExists();
  }, []);

  // Redirect if already logged in
  if (isAuthenticated) {
    const redirectPath = user?.role === 'admin' ? '/admin-panel' : '/chair-dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(email, password);
      // Success message will be handled in the auth context
    } catch (error: any) {
      // Error handling is in the login function
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent/10 dark:bg-accent/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl"></div>
      </div>
      
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md px-4 animate-fade-in z-10">
        <div className="text-center mb-8">
          {logoExists ? (
            <div className="relative w-24 h-24 mx-auto mb-4 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center p-2 border-4 border-white dark:border-gray-700">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  // Fallback if image fails to load
                  setLogoExists(false);
                }}
              />
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent dark:from-blue-800 dark:to-blue-600 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300 border-4 border-white dark:border-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9h.01"></path>
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <circle cx="12" cy="15" r="3"></circle>
              </svg>
            </div>
          )}
          <h1 className="text-3xl font-bold text-primary dark:text-white tracking-tight mb-1">ISBMUN'25</h1>
          <p className="text-base text-gray-600 dark:text-gray-300">Conference Dashboard</p>
        </div>

        <Card className="border-none shadow-xl bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 dark:backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-2xl font-semibold text-center dark:text-white">Sign in</CardTitle>
            <CardDescription className="text-center text-gray-500 dark:text-gray-400">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="youremail@isbmun.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 focus-visible:ring-accent dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 focus-visible:ring-accent dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-accent hover:bg-accent/90 text-white font-medium py-2 rounded-md flex items-center justify-center gap-2 transition-all dark:bg-blue-700 dark:hover:bg-blue-600"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    Sign in 
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-center pb-6">
            <button 
              type="button"
              className="text-sm text-accent hover:text-accent/80 hover:underline transition-colors dark:text-blue-400 dark:hover:text-blue-300"
              onClick={() => toast.info("Password reset functionality", {
                description: "Please contact your MUN organizers to reset your password",
                duration: 5000
              })}
            >
              Forgot your password?
            </button>
          </CardFooter>
        </Card>

        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} ISBMUN. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
