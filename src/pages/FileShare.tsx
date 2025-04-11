
import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Printer, Mail } from 'lucide-react';
import { printCountService } from '@/services/printCountService';
import { toast } from 'sonner';

const FileShare = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const councilName = user?.council?.toLowerCase() || '';
  
  const handlePrintRequest = async () => {
    setIsLoading(true);
    try {
      // Increment print counts
      const { councilCount, globalCount } = await printCountService.incrementPrintCounts(councilName);
      
      // Format council print count with leading zero if needed
      const formattedCouncilCount = councilCount.toString().padStart(2, '0');
      
      // Determine d1 or d2 based on current date
      const currentDate = new Date();
      const dateDesignation = currentDate <= new Date('2025-05-16') ? 'd1' : 'd2';
      
      // Create email subject with print code
      const printCode = `#${councilName}${formattedCouncilCount}-${globalCount}${dateDesignation}`;
      
      // Create email body
      const emailBody = `Dear Admin Team,

Please find the attached file for printing for the ${user?.council} council. Let me know if any changes are needed.

Regards,
Chair – ${user?.council}`;
      
      // Create Gmail compose URL with parameters
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=admin-print@isbmun.com&su=${encodeURIComponent(`${printCode} — File for Printing`)}&body=${encodeURIComponent(emailBody)}`;
      
      // Open Gmail compose in a new window
      window.open(gmailUrl, '_blank');
      
      toast.success('Gmail compose window opened', {
        description: 'Please attach your file before sending.'
      });
    } catch (error) {
      console.error('Error handling print request:', error);
      toast.error('Failed to process print request', {
        description: 'Please try again or contact support.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOtherRequest = () => {
    try {
      // Create email subject
      const subject = `File Share – ${user?.council}`;
      
      // Create email body
      const emailBody = `Dear Admins,

Please find the attached file regarding [brief description]. This is not for printing, but for your attention.

Regards,
Chair – ${user?.council}`;
      
      // Create Gmail compose URL with parameters
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=admin-support@isbmun.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Open Gmail compose in a new window
      window.open(gmailUrl, '_blank');
      
      toast.success('Gmail compose window opened', {
        description: 'Please attach your file and add a brief description before sending.'
      });
    } catch (error) {
      console.error('Error handling other request:', error);
      toast.error('Failed to open mail client', {
        description: 'Please try again or contact support.'
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 animate-fade-in">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-primary dark:text-white">File Share</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Share files with the admin team
            </p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Printer className="h-5 w-5" />
                  Send File for Printing
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Use this option to send a file to the admin team for printing. A unique print code will be generated automatically.
                </p>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800 mb-6">
                  <h3 className="font-medium text-blue-700 dark:text-blue-300 mb-1">How it works:</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    1. Click the button below to open Gmail<br />
                    2. The email will be pre-filled with the necessary information<br />
                    3. <strong>Attach your file</strong> before sending<br />
                    4. A unique print code is automatically included in the subject
                  </p>
                </div>
                <Button 
                  onClick={handlePrintRequest} 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Send for Printing'}
                </Button>
              </CardContent>
            </Card>
            
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Mail className="h-5 w-5" />
                  Send File for Other Reasons
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Use this option to send files to the admin team for reasons other than printing (sharing documents, requesting feedback, etc.).
                </p>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-100 dark:border-amber-800 mb-6">
                  <h3 className="font-medium text-amber-700 dark:text-amber-300 mb-1">How it works:</h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    1. Click the button below to open Gmail<br />
                    2. The email will be pre-filled with a template<br />
                    3. <strong>Add a brief description</strong> of your request<br />
                    4. <strong>Attach your file</strong> before sending
                  </p>
                </div>
                <Button 
                  onClick={handleOtherRequest} 
                  className="w-full"
                  variant="outline"
                >
                  Send for Other Reasons
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileShare;
