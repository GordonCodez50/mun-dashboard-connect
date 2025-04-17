
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertTriangle } from "lucide-react";

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
              <h4 className="font-medium">Common Issues</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Attendance changes not appearing - Try refreshing the page</li>
                <li>Status updates not reflecting - Check your internet connection</li>
                <li>Empty participant list - Verify council selection and filters</li>
                <li>Batch marking not working - Ensure participants are selected</li>
              </ul>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
