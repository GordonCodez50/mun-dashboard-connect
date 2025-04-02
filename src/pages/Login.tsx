
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from "sonner";
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoExists, setLogoExists] = useState(false);
  const { login } = useAuth();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(email, password);
    } catch (error) {
      // Error is handled in the login function
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="min-h-screen w-full flex flex-col items-center justify-center py-12 sm:px-6 lg:px-8 animate-fade-in">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
          {logoExists ? (
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="mx-auto w-24 h-24 object-contain mb-4 shadow-lg rounded-full"
            />
          ) : (
            <div className="mx-auto w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9h.01"></path>
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <circle cx="12" cy="15" r="3"></circle>
              </svg>
            </div>
          )}
          <h2 className="text-center text-3xl font-extrabold text-primary">ISBMUN'25</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Conference Dashboard
          </p>
        </div>

        <div className="w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-xl border border-gray-100">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primary">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 input-shadow focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                    placeholder="Enter your email address"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Example: chair-ecosoc@isbmun.com or admin@isbmun.com
                </p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-primary">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 input-shadow focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent button-transition ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Log in'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                For demo, use "chair-ecosoc@isbmun.com" or "admin@isbmun.com" with password "password"
              </p>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <a href="#" className="text-sm text-accent hover:text-accent/80">
              Forgot your password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
