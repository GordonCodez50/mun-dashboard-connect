
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

// External navigation button for chair dashboard
export const externalNavButton: NavButtonConfig = {
  text: "Resources",
  url: "https://isbmun.com/resources",
  openInNewTab: true
};

// Page titles for mobile headers
export const pageTitles = {
  admin: "Admin Panel",
  chair: "Chair Dashboard",
  press: "Press Dashboard",
  timer: "Timer Management",
  userManagement: "User Management"
};
