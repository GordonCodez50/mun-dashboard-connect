
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Printer, AlertCircle } from 'lucide-react';
import { extractCouncilName, generatePrintCode } from '@/utils/emailUtils';

const FileShare = () => {
  const { user } = useAuth();
  const councilName = extractCouncilName(user?.email || '');

  const handlePrintEmail = () => {
    const recipient = 'admin-print@isbmun.com';
    const printCode = generatePrintCode(councilName);
    const subject = encodeURIComponent(`${printCode} — File for Printing`);
    const body = encodeURIComponent(
      `Dear Admin Team,\n\nPlease find the attached file for printing for the ${councilName.toUpperCase()} council. Let me know if any changes are required.\n\nRegards,\nChair – ${councilName.toUpperCase()}`
    );
    
    window.open(`mailto:${recipient}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleOtherEmail = () => {
    const recipient = 'admin-support@isbmun.com';
    const subject = encodeURIComponent(`File Share – ${councilName.toUpperCase()}`);
    const body = encodeURIComponent(
      `Dear Admins,\n\nPlease find the attached file regarding [brief description]. This is not for printing, but for your attention.\n\nRegards,\nChair – ${councilName.toUpperCase()}`
    );
    
    window.open(`mailto:${recipient}?subject=${subject}&body=${body}`, '_blank');
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
            <Card className="border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800">
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
                  className="w-full"
                >
                  Compose Print Email
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800">
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
                  className="w-full"
                >
                  Compose General Email
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">How to Use</h3>
            <ol className="list-decimal pl-5 text-blue-700 dark:text-blue-200 space-y-2">
              <li>Click on one of the buttons above to open a pre-filled email in Gmail</li>
              <li>Attach your file manually in the Gmail compose window</li>
              <li>Review the email content and make any necessary changes</li>
              <li>Send the email to the admin team</li>
            </ol>
          </div>
          
          {/* Troubleshooting Section */}
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
            <h3 className="text-lg font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5" />
              Troubleshooting
            </h3>
            <p className="text-amber-700 dark:text-amber-200 mb-2">
              If the email compose buttons don't work, you need to allow Gmail to handle mailto links:
            </p>
            <ol className="list-decimal pl-5 text-amber-700 dark:text-amber-200 space-y-2">
              <li>Go to Gmail in your browser</li>
              <li>Click the small rhombus icon at the end of address bar <img src="/lovable-uploads/793b8d7e-cb28-45d6-a66a-1edbd7f9e81c.png" alt="Gmail address bar with rhombus icon highlighted" className="inline-block h-6 ml-1 align-middle rounded border border-amber-200 dark:border-amber-700" /></li>
              <li>Follow the prompts to set up Gmail as your email handler</li>
              <li>Enjoy seamless email composition!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileShare;
