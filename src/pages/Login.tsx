import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoExists, setLogoExists] = useState(false);
  const { login, isAuthenticated, user } = useAuth();

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
    } catch (error: any) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const emailSubject = "Password Reset Request - ISBMUN'25 Dashboard";
    const emailBody = `Hello ISBMUN Admin,

I would like to request a password reset for my ISBMUN'25 Dashboard account.

Account Email: ${email}

Please send the new password to this email address.

Best regards,
${email}`;

    const mailtoLink = `mailto:isbmunconference@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-accent/5 to-primary/5">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-accent/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-accent/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md px-4 z-10 animate-fade-in">
        <div className="text-center mb-8 animate-scale-in">
          {logoExists ? (
            <div className="relative w-24 h-24 mx-auto mb-4 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-center p-2 border-4 border-white transform hover:scale-105 transition-transform">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  setLogoExists(false);
                }}
              />
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-4 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9h.01"></path>
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <circle cx="12" cy="15" r="3"></circle>
              </svg>
            </div>
          )}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight mb-1 animate-fade-in animation-delay-200">ISBMUN'25</h1>
          <p className="text-base text-gray-600 animate-fade-in animation-delay-300">Conference Dashboard</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/95 border-none shadow-2xl relative overflow-hidden group animate-scale-in animation-delay-400">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <CardHeader className="space-y-1 pb-2 relative">
            <CardTitle className="text-2xl font-semibold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Sign in</CardTitle>
            <CardDescription className="text-center text-gray-500">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-hover:text-accent transition-colors duration-200">
                    <Mail className="h-5 w-5" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="youremail@isbmun.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 focus-visible:ring-accent transition-shadow duration-200 hover:shadow-md"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-hover:text-accent transition-colors duration-200">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 focus-visible:ring-accent transition-shadow duration-200 hover:shadow-md"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-accent transition-colors duration-200"
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
                className="w-full bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-white font-medium py-2 rounded-md flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    Sign in 
                    <ArrowRight className="h-4 w-4 animate-slide-in" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-center pb-6">
            <button 
              type="button"
              className="text-sm text-accent hover:text-accent/80 hover:underline transition-colors duration-200"
              onClick={handleForgotPassword}
            >
              Forgot your password?
            </button>
          </CardFooter>
        </Card>

        <div className="text-center mt-8 text-sm text-gray-500 animate-fade-in animation-delay-500">
          <p>© {new Date().getFullYear()} ISBMUN. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
