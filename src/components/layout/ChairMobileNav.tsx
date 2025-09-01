import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LayoutDashboard, Timer, UserCheck, FileText, Settings, ExternalLink, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { externalNavButton } from "@/config/navigationConfig";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
}

// Glass Effect Wrapper Component
const GlassEffect: React.FC<GlassEffectProps> = ({
  children,
  className = "",
  style = {},
  onClick,
}) => {
  const glassStyle = {
    boxShadow: "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)",
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };

  return (
    <div
      className={`relative flex font-semibold overflow-hidden text-black cursor-pointer transition-all duration-700 rounded-3xl ${className}`} // ✅ fixed radius here
      style={glassStyle}
      onClick={onClick}
    >
      {/* Glass Layers */}
      <div
        className="absolute inset-0 z-0 overflow-hidden rounded-3xl"
        style={{
          backdropFilter: "blur(10px)",
          filter: "url(#glass-distortion)",
          isolation: "isolate",
        }}
      />
      <div
        className="absolute inset-0 z-10 rounded-3xl"
        style={{ background: "rgba(255, 255, 255, 0.15)" }}
      />
      <div
        className="absolute inset-0 z-20 rounded-3xl overflow-hidden"
        style={{
          boxShadow:
            "inset 1px 1px 1px 0 rgba(255, 255, 255, 0.3), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.2)",
        }}
      />

      {/* Content */}
      <div className="relative z-30">{children}</div>
    </div>
  );
};

// SVG Filter Component
const GlassFilter: React.FC = () => (
  <svg style={{ display: "none" }}>
    <filter
      id="glass-distortion"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.001 0.005"
        numOctaves="1"
        seed="17"
        result="turbulence"
      />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
      <feSpecularLighting
        in="softMap"
        surfaceScale="5"
        specularConstant="1"
        specularExponent="100"
        lightingColor="white"
        result="specLight"
      >
        <fePointLight x="-200" y="-200" z="300" />
      </feSpecularLighting>
      <feComposite
        in="specLight"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="1"
        k4="0"
        result="litImage"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="softMap"
        scale="200"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
);

// Chair Mobile Navigation Component
export const ChairMobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // Only show for chair users (non-admin, non-press)
  const isChair = user && user.role === 'chair' && user.council !== 'PRESS';
  
  if (!isChair) return null;

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  const getMenuItems = (): MenuItem[] => {
    if (user?.role === 'admin-rt') {
      return [
        { 
          icon: <LayoutDashboard size={20} />, 
          label: "Dashboard", 
          href: "/rt-admin-dashboard" 
        },
        { 
          icon: <Settings size={20} />, 
          label: "Settings", 
          href: "/settings" 
        },
        { 
          icon: <LogOut size={20} />, 
          label: "Logout", 
          onClick: handleLogout
        },
      ];
    }
    
    if (user?.role === 'member-hcc' || user?.role === 'member-fcc') {
      return [
        { 
          icon: <LayoutDashboard size={20} />, 
          label: "Dashboard", 
          href: "/member-dashboard" 
        },
        { 
          icon: <Settings size={20} />, 
          label: "Settings", 
          href: "/settings" 
        },
        { 
          icon: <LogOut size={20} />, 
          label: "Logout", 
          onClick: handleLogout
        },
      ];
    }
    
    // Default chair menu items
    return [
      { 
        icon: <LayoutDashboard size={20} />, 
        label: "Dashboard", 
        href: "/chair-dashboard" 
      },
      { 
        icon: <Timer size={20} />, 
        label: "Timer", 
        href: "/timer" 
      },
      { 
        icon: <UserCheck size={20} />, 
        label: "Attendance", 
        href: "/chair-attendance" 
      },
      { 
        icon: <Settings size={20} />, 
        label: "Settings", 
        href: "/settings" 
      },
      { 
        icon: <LogOut size={20} />, 
        label: "Logout", 
        onClick: handleLogout
      },
    ];
  };

  const menuItems = getMenuItems();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (path: string) => location.pathname === path;

  const containerVariants = {
    closed: {
      width: 56,
      height: 56,
      borderRadius: "9999px", // keeps it perfectly round in closed state
      transition: {
        duration: 0.6,
        ease: [0.175, 0.885, 0.32, 1.275],
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
    open: {
      width: 160,
      height: "auto",
      borderRadius: "24px", // stays rounded throughout transition
      transition: {
        duration: 0.6,
        ease: [0.175, 0.885, 0.32, 1.275],
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    closed: {
      opacity: 0,
      y: 20,
      scale: 0.8,
      transition: {
        duration: 0.3,
        ease: [0.175, 0.885, 0.32, 1.275],
      },
    },
    open: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.175, 0.885, 0.32, 1.275],
      },
    },
  };

  const iconVariants = {
    closed: { rotate: 0 },
    open: { rotate: 180 },
  };

  return (
    <div className="fixed top-6 right-6 z-50 md:hidden">
      <GlassFilter />
      
      <motion.div
        variants={containerVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        className="relative"
      >
        <GlassEffect className={`${isOpen ? 'rounded-3xl py-3 pl-3 pr-2' : 'rounded-full flex items-center justify-center p-2'}`}>
          <div className="flex flex-col">
            {/* Menu Toggle Button */}
            <motion.button
              onClick={toggleMenu}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-300 hover:bg-white/10 ${isOpen ? 'ml-auto' : 'm-0'}`}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div 
                variants={iconVariants}
                className="flex items-center justify-center"
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.div>
            </motion.button>

            {/* Menu Items */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] }}
                  className="mt-4 space-y-2 overflow-hidden"
                >
                  {menuItems.map((item, index) => {
                    const isCurrentlyActive = item.href && isActive(item.href);
                    const isLogoutItem = item.label === "Logout";
                    
                    const itemContent = (
                      <motion.div
                        key={item.label}
                        variants={itemVariants}
                        custom={index}
                        className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 cursor-pointer group ${
                          isCurrentlyActive 
                            ? 'bg-white/20 text-black' 
                            : isLogoutItem
                              ? 'hover:bg-red-100/20 text-red-600'
                              : 'hover:bg-white/10'
                        }`}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (!isLogoutItem) {
                            item.onClick?.();
                            setIsOpen(false);
                          }
                        }}
                      >
                        <motion.div
                          className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                          whileHover={{ rotate: 5 }}
                        >
                          {item.icon}
                        </motion.div>
                        <span className={`text-sm font-medium transition-colors duration-300 ${
                          isLogoutItem 
                            ? 'text-red-600 group-hover:text-red-700' 
                            : 'text-black/90 group-hover:text-black'
                        }`}>
                          {item.label}
                        </span>
                      </motion.div>
                    );

                    if (isLogoutItem) {
                      return (
                        <AlertDialog key={item.label}>
                          <AlertDialogTrigger asChild>
                            {itemContent}
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to logout? You will need to sign in again to access your account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => {
                                  item.onClick?.();
                                  setIsOpen(false);
                                }}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Logout
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      );
                    }

                    if (item.external && item.href) {
                      return (
                        <a
                          key={item.label}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          {itemContent}
                        </a>
                      );
                    } else if (item.href) {
                      return (
                        <Link
                          key={item.label}
                          to={item.href}
                          className="block"
                        >
                          {itemContent}
                        </Link>
                      );
                    } else {
                      return itemContent;
                    }
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassEffect>
      </motion.div>
    </div>
  );
};
