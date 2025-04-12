
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Printer, AlertCircle, ChevronDown } from 'lucide-react';
import { extractCouncilName, generatePrintCode } from '@/utils/emailUtils';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';

const FileShare = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { permissionGranted, requestPermission } = useNotifications();
  const councilName = extractCouncilName(user?.email || '');

  const handlePrintEmail = () => {
    const recipient = 'admin-print@isbmun.com';
    const printCode = generatePrintCode(councilName);
    const subject = encodeURIComponent(`${printCode} — File for Printing`);
    const body = encodeURIComponent(
      `Dear Admin Team,\n\nPlease find the attached file for printing for the ${councilName.toUpperCase()} council. Let me know if any changes are required.\n\nRegards,\nChair – ${councilName.toUpperCase()}`
    );
    
    window.open(`mailto:${recipient}?subject=${subject}&body=${body}`, '_blank');
    
    // Show success toast
    toast({
      title: "Email ready",
      description: "Print request email has been prepared. Please attach your files.",
      duration: 5000
    });
  };

  const handleOtherEmail = () => {
    const recipient = 'admin-support@isbmun.com';
    const subject = encodeURIComponent(`File Share – ${councilName.toUpperCase()}`);
    const body = encodeURIComponent(
      `Dear Admins,\n\nPlease find the attached file regarding [brief description]. This is not for printing, but for your attention.\n\nRegards,\nChair – ${councilName.toUpperCase()}`
    );
    
    window.open(`mailto:${recipient}?subject=${subject}&body=${body}`, '_blank');
    
    // Show success toast
    toast({
      title: "Email ready",
      description: "General support email has been prepared. Please attach your files.",
      duration: 5000
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 animate-fade-in">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-primary dark:text-white">File Share</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Send files to administrators via email
            </p>
          </header>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800 transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-primary dark:text-white flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  Send File for Printing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Send a file to the admin team for printing. A print code will be automatically generated.
                </p>
                <Button 
                  onClick={handlePrintEmail}
                  className="w-full transition-all duration-200"
                >
                  Compose Print Email
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800 transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-primary dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Send File for Other Reasons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Send a file to the admin team for reasons other than printing.
                </p>
                <Button 
                  onClick={handleOtherEmail}
                  variant="outline"
                  className="w-full transition-all duration-200"
                >
                  Compose General Email
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8">
            {!permissionGranted && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 animate-fade-in">
                <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5" />
                  Enable Notifications
                </h3>
                <p className="text-blue-700 dark:text-blue-200 mb-3">
                  Get notified about important events and updates. Notifications work on all devices including mobile phones.
                </p>
                <Button 
                  onClick={requestPermission}
                  variant="outline" 
                  className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/40"
                >
                  Enable Notifications
                </Button>
              </div>
            )}
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 animate-fade-in">
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">How to Use</h3>
              <ol className="list-decimal pl-5 text-blue-700 dark:text-blue-200 space-y-2">
                <li>Click on one of the buttons above to open a pre-filled email in Gmail</li>
                <li>Attach your file manually in the Gmail compose window</li>
                <li>Review the email content and make any necessary changes</li>
                <li>Send the email to the admin team</li>
              </ol>
            </div>
          </div>
          
          {/* Troubleshooting Section as Accordion */}
          <div className="mt-6">
            <Accordion type="single" collapsible className="border rounded-lg overflow-hidden">
              <AccordionItem value="troubleshooting" className="border-0">
                <AccordionTrigger className="p-4 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-b border-amber-100 dark:border-amber-800 transition-all">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-lg font-medium">Troubleshooting</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-amber-50/70 dark:bg-amber-900/10 px-4 py-3 border-amber-100 dark:border-amber-800">
                  <p className="text-amber-700 dark:text-amber-200 mb-3">
                    If the email compose buttons don't work, you need to allow Gmail to handle mailto links:
                  </p>
                  <ol className="list-decimal pl-5 text-amber-700 dark:text-amber-200 space-y-3">
                    <li>Go to Gmail in your browser</li>
                    <li className="flex flex-col md:flex-row md:items-center gap-3">
                      <span>Click the rhombus icon in the address bar as shown:</span>
                      <div className="mx-auto md:mx-0 p-2 bg-white dark:bg-gray-700 rounded-md border border-amber-200 dark:border-amber-700 inline-flex items-center shadow-sm">
                        <img 
                          src="/lovable-uploads/496e4fca-3405-41d1-8be4-dea6d4dd11d0.png" 
                          alt="Gmail address bar with rhombus icon highlighted" 
                          className="h-14 md:h-16 rounded object-contain transition-all duration-200 hover:opacity-95"
                        />
                      </div>
                    </li>
                    <li>Follow the prompts to set up Gmail as your email handler</li>
                    <li>Enjoy seamless email composition!</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileShare;
