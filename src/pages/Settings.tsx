
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowRight, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  FileText, 
  SettingsIcon, // Renamed from Settings to SettingsIcon
  User, 
  Bell,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useNavigate } from 'react-router-dom';

// App version information
const APP_VERSION = "v2.1.3";
const CHANGELOG = [
  {
    version: "v2.1.3",
    date: "2025-05-05",
    changes: [
      "Added Settings page",
      "Improved notification reliability",
      "Fixed timer reset issue",
    ]
  },
  {
    version: "v2.1.2",
    date: "2025-04-28",
    changes: [
      "Enhanced attendance tracking",
      "Fixed UI issues in dark mode",
      "Improved file sharing permissions",
    ]
  },
  {
    version: "v2.1.1",
    date: "2025-04-15",
    changes: [
      "Security updates and bug fixes",
      "Added council-specific alerts",
      "Optimized performance for large councils",
    ]
  },
];

// Mock data for usage statistics - in a real app, this would come from the backend
const USAGE_DATA = {
  alertsSent: 124,
  councilsMonitored: 8
};

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");

  // Handle opening the debug console
  const handleOpenDebug = () => {
    navigate('/debug');
  };
  
  // Handle going back to the previous page
  const handleGoBack = () => {
    // Determine appropriate page to navigate to based on user role
    if (user?.role === 'admin') {
      navigate('/admin-panel');
    } else if (user?.role === 'chair' && user?.council === 'PRESS') {
      navigate('/press-dashboard');
    } else {
      navigate('/chair-dashboard');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="container max-w-6xl py-6 px-4 md:px-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-1" 
                onClick={handleGoBack}
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            </div>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>
          
          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            {/* App Version Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  App Information
                </CardTitle>
                <CardDescription>
                  Current version and release notes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Version:</span>
                    <span className="text-sm bg-primary/10 text-primary px-2 py-0.5 rounded">{APP_VERSION}</span>
                  </div>
                  
                  <Accordion type="single" collapsible>
                    <AccordionItem value="changelog">
                      <AccordionTrigger className="text-sm font-medium py-2">
                        Changelog
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-sm space-y-4 max-h-64 overflow-y-auto pr-2">
                          {CHANGELOG.map((release) => (
                            <div key={release.version} className="pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium text-primary">{release.version}</h4>
                                <span className="text-xs text-gray-500">{release.date}</span>
                              </div>
                              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                                {release.changes.map((change, i) => (
                                  <li key={i} className="text-sm">{change}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </CardContent>
            </Card>

            {/* Data Usage Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Data Usage Overview
                </CardTitle>
                <CardDescription>
                  Summary of your activity and data usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid ${isAdmin ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Alerts Sent</span>
                    <span className="text-2xl font-bold">{USAGE_DATA.alertsSent}</span>
                  </div>
                  
                  {isAdmin && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg flex flex-col">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Councils Monitored</span>
                      <span className="text-2xl font-bold">{USAGE_DATA.councilsMonitored}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Info Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Details about your account and session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Full Name</span>
                      <span className="font-medium">{user?.name}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Role</span>
                      <div className="flex items-center gap-2">
                        <span className="capitalize font-medium">{user?.role}</span>
                        {user?.council && (
                          <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
                            {user.council}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Login Method</span>
                      <span className="font-medium">Email & Password</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Username</span>
                      <span className="font-medium">{user?.username}</span>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Session ID</span>
                      <span className="font-mono text-sm truncate">sess_{Math.random().toString(36).substring(2, 15)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Last Login</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm">{new Date().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Debug & Developer Tools</CardTitle>
                <CardDescription>
                  Advanced tools for troubleshooting and development
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Debug Console</h3>
                      <p className="text-sm text-gray-500">
                        Access system diagnostics and troubleshooting tools
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleOpenDebug}>
                      Open Debug Console
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between opacity-60">
                    <div>
                      <h3 className="font-medium">Experimental Features</h3>
                      <p className="text-sm text-gray-500">
                        Coming soon: Access beta and experimental features
                      </p>
                    </div>
                    <Button variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between opacity-60">
                    <div>
                      <h3 className="font-medium">Advanced Configuration</h3>
                      <p className="text-sm text-gray-500">
                        Coming soon: Configure advanced system parameters
                      </p>
                    </div>
                    <Button variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
