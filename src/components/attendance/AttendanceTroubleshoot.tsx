
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export const AttendanceTroubleshoot = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      whileHover={{ 
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        y: -5
      }}
    >
      <Accordion type="single" collapsible className="bg-white/80 backdrop-blur-sm rounded-lg p-2 shadow-md border border-gray-100">
        <AccordionItem value="troubleshoot" className="border-none">
          <AccordionTrigger className="hover:no-underline px-2">
            <div className="flex items-center gap-2 text-sm">
              <motion.div
                animate={{ rotate: [0, 10, 0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </motion.div>
              <span className="font-medium">Troubleshooting Guide</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 py-2 px-2">
              <div className="space-y-2">
                <h4 className="font-medium">Common Issues</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <motion.li
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    Attendance changes not appearing - Try refreshing the page
                  </motion.li>
                  <motion.li
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Status updates not reflecting - Check your internet connection
                  </motion.li>
                  <motion.li
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Empty participant list - Verify council selection and filters
                  </motion.li>
                  <motion.li
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Batch marking not working - Ensure participants are selected
                  </motion.li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
};
