
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

// Mobile specific configuration
export const mobileConfig = {
  // Animation timings
  animationDuration: 300, // ms
  transitionTiming: 'ease-out',
  // Colors
  primaryColor: '#9b87f5',
  secondaryColor: '#7E69AB',
  backgroundColor: '#f9f9fc'
};
