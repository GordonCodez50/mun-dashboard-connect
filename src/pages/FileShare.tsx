
import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Printer, Send, ArrowRight, FileText, Copy, Check } from 'lucide-react';
import { printCountService } from '@/services/printCountService';
import { useIsMobile } from '@/hooks/use-mobile';
import { mobileConfig } from '@/config/navigationConfig';

// Get the day of the month for the d1/d2 logic
const getDayDesignation = (): string => {
  const today = new Date();
  return today.getDate() <= 16 && today.getMonth() === 4 ? 'd1' : 'd2'; // May is month 4 (0-indexed)
};

// Format a number with leading zeros (e.g., 2 → "02")
const formatWithLeadingZeros = (num: number): string => {
  return num.toString().padStart(2, '0');
};

const FileShare = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState<string | null>(null);
  const [printCode, setPrintCode] = useState<string | null>(null);

  // Extract council name from chair email or from user council
  const councilName = user?.council ? user.council.toLowerCase() : 
                      user?.email?.match(/chair-([^@]+)@/)?.[1] || 'unknown';

  const handleSendForPrinting = async () => {
    try {
      setLoading('print');
      
      // Increment both print counters
      const { councilCount, globalCount } = await printCountService.incrementPrintCounts(councilName);
      
      // Format the council print count with leading zeros (e.g., 2 → "02")
      const formattedCouncilCount = formatWithLeadingZeros(councilCount);
      
      // Get the day designation (d1 or d2)
      const dayDesignation = getDayDesignation();
      
      // Construct the print code
      const code = `#${councilName}${formattedCouncilCount}-${globalCount}${dayDesignation}`;
      setPrintCode(code);
      
      // Construct the Gmail compose URL
      const subject = encodeURIComponent(`${code} — File for Printing`);
      const body = encodeURIComponent(`Dear Admin Team,

Please find the attached file for printing for the ${councilName.toUpperCase()} council. Let me know if any changes are needed.

Regards,
Chair – ${councilName.toUpperCase()}`);
      
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=admin-print@isbmun.com&su=${subject}&body=${body}`;
      
      // Open Gmail in a new tab
      window.open(gmailUrl, '_blank');
      
      toast.success('Gmail compose window opened', {
        description: 'Please attach your file before sending',
      });
    } catch (error) {
      console.error('Error preparing print email:', error);
      toast.error('Failed to prepare email', {
        description: 'Please try again or contact support',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleSendForOtherReasons = () => {
    try {
      setLoading('other');
      
      // Construct the Gmail compose URL
      const subject = encodeURIComponent(`File Share – ${councilName.toUpperCase()}`);
      const body = encodeURIComponent(`Dear Admins,

Please find the attached file regarding [brief description]. This is not for printing, but for your attention.

Regards,
Chair – ${councilName.toUpperCase()}`);
      
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=admin-support@isbmun.com&su=${subject}&body=${body}`;
      
      // Open Gmail in a new tab
      window.open(gmailUrl, '_blank');
      
      toast.success('Gmail compose window opened', {
        description: 'Please attach your file before sending',
      });
    } catch (error) {
      console.error('Error preparing email:', error);
      toast.error('Failed to prepare email', {
        description: 'Please try again or contact support',
      });
    } finally {
      setLoading(null);
    }
  };

  const copyPrintCodeToClipboard = () => {
    if (printCode) {
      navigator.clipboard.writeText(printCode);
      toast.success('Print code copied to clipboard');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 animate-fade-in max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-primary dark:text-white">File Sharing</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Share files with the administrative team
            </p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Send for Printing Card */}
            <Card className="border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl text-primary dark:text-white">
                  <Printer className="h-5 w-5" />
                  Send File for Printing
                </CardTitle>
                <CardDescription>
                  For documents that need to be printed
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 pb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  This will open Gmail with a pre-filled template for sending files to the print team. You'll need to manually attach your file.
                </p>
                {printCode && (
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your Print Code:</p>
                        <p className="font-mono font-medium">{printCode}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={copyPrintCodeToClipboard}
                        className="flex gap-1 items-center"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSendForPrinting} 
                  disabled={loading === 'print'}
                  className="w-full flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: loading === 'print' ? '#ccc' : mobileConfig.primaryColor,
                    transition: `background-color ${mobileConfig.animationDuration}ms ${mobileConfig.transitionTiming}`,
                  }}
                >
                  {loading === 'print' ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Preparing...
                    </>
                  ) : (
                    <>
                      Send for Printing
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Send for Other Reasons Card */}
            <Card className="border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl text-primary dark:text-white">
                  <FileText className="h-5 w-5" />
                  Send File for Other Reasons
                </CardTitle>
                <CardDescription>
                  For sharing files that don't need printing
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 pb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  This will open Gmail with a template for sending files to the admin team for purposes other than printing. You'll need to manually attach your file and provide a brief description.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSendForOtherReasons} 
                  disabled={loading === 'other'}
                  className="w-full flex items-center justify-center gap-2"
                  variant="outline"
                >
                  {loading === 'other' ? (
                    <>
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      Preparing...
                    </>
                  ) : (
                    <>
                      Send for Other Reasons
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <h2 className="text-lg font-medium text-primary dark:text-white mb-2">How it works</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>Click on one of the options above based on your needs</li>
              <li>A Gmail compose window will open in a new tab</li>
              <li>Attach your file to the email (Gmail will prompt you to do this)</li>
              <li>Review the pre-filled subject and message</li>
              <li>Send the email</li>
            </ol>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Note: Print codes are automatically generated and include your council name, a council-specific count, and a global print job counter. The code will also include either d1 or d2 depending on the date.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileShare;
