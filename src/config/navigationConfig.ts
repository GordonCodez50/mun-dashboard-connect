
/**
 * Configuration for the navigation menu in the chair panel
 * 
 * This file allows for easy modification of the navigation button
 * without changing the core components.
 */

interface NavButtonConfig {
  text: string;
  url: string;
  openInNewTab?: boolean;
}

export const externalNavButton: NavButtonConfig = {
  text: "Resources",
  url: "https://isbmun.com/resources",
  openInNewTab: true
};

// Mobile specific navigation options
export const mobileNavigation = {
  adminPanel: {
    title: "Admin Dashboard",
    path: "/admin-panel"
  },
  userManagement: {
    title: "User Management",
    path: "/user-management"
  },
  chairDashboard: {
    title: "Chair Dashboard",
    path: "/chair-dashboard"
  },
  timerManager: {
    title: "Timer", 
    path: "/timer"
  }
};

// Animation settings for mobile components
export const mobileAnimationConfig = {
  pageTransition: "animate-fade-in",
  cardEnter: "animate-scale-in",
  listItem: "animate-fade-in",
  buttonHover: "hover:scale-105 transition-transform"
};
