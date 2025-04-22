
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertTriangle, HelpCircle, Cpu, Wifi, RefreshCw } from "lucide-react";

export const AttendanceTroubleshoot = () => {
  return (
    <Accordion type="single" collapsible className="bg-muted/50 rounded-lg p-2">
      <AccordionItem value="troubleshoot">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Troubleshooting Guide
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                Common Issues
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>
                  <span className="font-medium">Attendance changes not appearing</span> - Try refreshing the page or check if you have saved your changes
                </li>
                <li>
                  <span className="font-medium">Status updates not reflecting</span> - Check your internet connection and refresh the page
                </li>
                <li>
                  <span className="font-medium">Empty participant list</span> - Verify council selection and filters
                </li>
                <li>
                  <span className="font-medium">Batch marking not working</span> - Ensure participants are selected
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Wifi className="h-4 w-4 text-primary" />
                Connection Issues
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>If you see a "disconnected" warning, check your WiFi connection</li>
                <li>For persistent connection errors, try using a different network or hotspot</li>
                <li>Make sure you're not in airplane mode or restricted network</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                Performance Tips
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Close other tabs and applications to improve performance</li>
                <li>For large councils, try filtering participants to manage the view</li>
                <li>If the app feels slow, try reloading the page</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-primary" />
                Quick Recovery Steps
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>If you encounter an error, refresh the page first</li>
                <li>Clear your browser cache if problems persist</li>
                <li>Contact the tech team at isbmunconference@gmail.com for urgent assistance</li>
                <li>Note down the exact error message if possible before reporting</li>
              </ul>
            </div>

            <div className="mt-3 bg-blue-50 p-2 rounded text-xs text-blue-700">
              <p className="font-medium">Conference Tech Support</p>
              <p>If you need immediate assistance during the conference, please contact the tech team via WhatsApp or find them at the registration desk.</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
