
import { useState, useEffect } from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { Navbar } from "@/components/ui/navbar";
import { GradientText } from "@/components/ui/gradient-text";
import { Footer } from "@/components/ui/footer";
import { useIsMobile } from "@/hooks/use-mobile";
import { CTA } from "@/components/ui/call-to-action";
import { BentoGrid } from "@/components/ui/bento-grid";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { motion } from "framer-motion";
import {
  Lock,
  Users,
  AlertTriangle,
  Clock,
} from "lucide-react";

export default function Home() {
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for 1.5 seconds
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden">
      <Navbar />

      <div className="flex flex-col pb-0 pt-[100px] -mt-20">
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center justify-center text-center">
              <h1 className="text-2xl sm:text-3xl font-semibold text-black dark:text-white">
                Welcome to
              </h1>
              <GradientText className="text-3xl sm:text-5xl md:text-[6rem] font-bold mt-2 leading-[1.1] md:leading-[0.9]">
                ISBMUN Dashboard 2025
              </GradientText>
            </div>
          }
        >
          <ResponsiveImage />
        </ContainerScroll>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 -mt-20 pb-0">
          <motion.h2 
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            ISBMUN 2025 Dashboard Highlights
          </motion.h2>

          <BentoGrid
            items={[
              {
                title: "Role-Based Access & Authentication",
                meta: "Multi-user",
                description:
                  "Whether you're an Admin managing the entire conference or a Chair running a council, the ISBMUN Dashboard ensures secure access with role-specific functionality.",
                icon: <Lock className="w-4 h-4 text-indigo-500" />,
                status: "Live",
                tags: ["Security", "Custom UI", "Login"],
                hasPersistentHover: true,
              },
              {
                title: "Smart Council Management",
                meta: "Live Sync",
                description:
                  "Admins can create, edit, and monitor multiple councils with real-time updates, seating plans, and speaker lists.",
                icon: <Users className="w-4 h-4 text-cyan-500" />,
                status: "Active",
                tags: ["Council", "Real-Time", "Admin Tools"],
              },
              {
                title: "Integrated Timer & Document Sharing",
                meta: "Built-In Tools",
                description:
                  "Manage speeches and debates with built-in timers, and upload draft resolutions right from the dashboard.",
                icon: <Clock className="w-4 h-4 text-yellow-500" />,
                status: "Ready",
                tags: ["Timer", "Documents", "Efficiency"],
              },
              {
                title: "Automated Attendance & Participation Tracking",
                meta: "Smart Records",
                description:
                  "Track delegate attendance in real time, auto-mark participation, and generate instant reports for council chairs and admins.",
                icon: <Users className="w-4 h-4 text-emerald-500" />,
                status: "Online",
                tags: ["Attendance", "Analytics", "Transparency"],
              },
              {
                title: "Instant Alerts & Assistance Requests",
                meta: "One-Tap",
                description:
                  "Chairs can send alerts instantly—tech support, misconduct, or procedural help—directly to the control room.",
                icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
                status: "Enabled",
                tags: ["Support", "Real-Time", "Chair Tools"],
                colSpan: 2,
              },
            ]}
          />

          <motion.div 
            className="mt-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.7, 
              delay: 0.6, 
              ease: [0.25, 0.1, 0.25, 1] 
            }}
          >
            <CTA />
          </motion.div>
        </section>
      </div>

      <Footer brandName="" />
    </div>
  );
}

function ResponsiveImage() {
  // Get window size for responsive image selection
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Select the appropriate image based on screen width
  const getImageSource = () => {
    if (windowWidth >= 1280) { // xl and above
      return "/public/Large.png";
    } else if (windowWidth >= 1024) { // lg
      return "/public/Medium-1.png";
    } else if (windowWidth >= 768) { // md
      return "/public/Medium-2.png";
    } else if (windowWidth >= 480) { // sm
      return "/public/Small-2.png";
    } else { // xs
      return "/public/Small-1.png";
    }
  };

  return (
    <div className="w-full h-full flex items-start justify-center">
      <img
        src={getImageSource()}
        alt="ISBMUN Dashboard"
        className="w-full object-cover object-top rounded-2xl"
        draggable={false}
      />
    </div>
  );
}
