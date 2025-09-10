import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  AlertTriangle
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
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
  onClick?: () => void;
  isMain?: boolean;
}

// Glass Effect Wrapper Component (same as AdminMobileNav for consistency)
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
      className={`relative flex font-semibold overflow-hidden text-foreground cursor-pointer transition-all duration-700 rounded-3xl bg-background/80 backdrop-blur-sm border border-border/50 ${className}`}
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
        className="absolute inset-0 z-10 rounded-3xl bg-gradient-to-br from-background/20 to-background/10"
      />
      <div
        className="absolute inset-0 z-20 rounded-3xl overflow-hidden border border-primary/10"
        style={{
          boxShadow:
            "inset 1px 1px 1px 0 hsl(var(--primary) / 0.1), inset -1px -1px 1px 1px hsl(var(--primary) / 0.05)",
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

interface LogisticsMobileNavProps {
  activeItem?: string;
}

export const LogisticsMobileNav: React.FC<LogisticsMobileNavProps> = ({ activeItem }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // Only show for logistics users
  const isLogistics = user && user.role === 'logistics';
  
  if (!isLogistics) return null;

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  // Main navigation items (always visible)
  const mainItems: MenuItem[] = [
    { 
      icon: <LayoutDashboard size={20} />, 
      label: "Dashboard", 
      href: "/logistics-dashboard",
      isMain: true
    },
    { 
      icon: <Users size={20} />, 
      label: "Participants", 
      href: "/logistics-participants",
      isMain: true
    },
  ];

  // Additional items (shown when expanded)
  const additionalItems: MenuItem[] = [
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

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <GlassFilter />
      
      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {/* Expanded menu overlay */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
              className="absolute bottom-16 left-4 right-4"
            >
              <GlassEffect className="rounded-2xl p-3">
                <div className="space-y-2">
                  {additionalItems.map((item, index) => {
                    const isLogoutItem = item.label === "Logout";
                    
                    const itemContent = (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 cursor-pointer group ${
                          item.href && isActive(item.href)
                            ? 'bg-primary/10 text-primary' 
                            : isLogoutItem
                              ? 'hover:bg-destructive/10 text-destructive'
                              : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          if (!isLogoutItem) {
                            item.onClick?.();
                            setIsExpanded(false);
                          }
                        }}
                      >
                        <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                          {item.icon}
                        </div>
                        <span className={`text-sm font-medium transition-colors duration-300 ${
                          isLogoutItem 
                            ? 'text-destructive group-hover:text-destructive/80' 
                            : 'text-foreground group-hover:text-foreground/80'
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
                          <AlertDialogContent className="w-[90%] max-w-md rounded-xl">
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
                                  setIsExpanded(false);
                                }}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Logout
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      );
                    }

                    if (item.href) {
                      return (
                        <Link
                          key={item.label}
                          to={item.href}
                          className="block"
                          onClick={() => setIsExpanded(false)}
                        >
                          {itemContent}
                        </Link>
                      );
                    } else {
                      return itemContent;
                    }
                  })}
                </div>
              </GlassEffect>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main navigation bar */}
        <GlassEffect className="mx-4 mb-4 rounded-2xl">
          <div className="flex items-center justify-between p-3">
            {/* Main navigation items */}
            <div className="flex items-center space-x-1 flex-1">
              {mainItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href!}
                  className={`flex flex-col items-center justify-center flex-1 p-3 rounded-xl transition-all duration-300 ${
                    isActive(item.href!)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <div className="transition-transform duration-300 hover:scale-110">
                    {item.icon}
                  </div>
                  <span className="text-xs font-medium mt-1">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>

            {/* Menu toggle */}
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center justify-center p-3 rounded-xl transition-all duration-300 ${
                isExpanded 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isExpanded ? <X size={20} /> : <Menu size={20} />}
              </motion.div>
            </motion.button>
          </div>
        </GlassEffect>
      </div>
    </>
  );
};