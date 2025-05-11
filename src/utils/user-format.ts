
/**
 * User Email Format Configuration
 * 
 * This file defines the email formats for different user categories in the application.
 * Edit these patterns to change how emails are mapped to user roles and councils.
 */

// Email domain used for all official accounts
export const EMAIL_DOMAIN = 'isbmun.com';

// Email format patterns for different user roles
export const EMAIL_FORMATS = {
  // Admin email formats:
  // 1. admin@isbmun.com (generic admin)
  // 2. name-admin@isbmun.com (named admin)
  ADMIN: {
    DEFAULT: `admin@${EMAIL_DOMAIN}`,
    NAMED: (name: string) => `${name.toLowerCase()}-admin@${EMAIL_DOMAIN}`,
    PATTERN_DEFAULT: /^admin@isbmun\.com$/,
    PATTERN_NAMED: /^([a-z0-9_\.-]+)-admin@isbmun\.com$/,
    // Function to extract name from admin email (for display purposes)
    extractName: (email: string): string | null => {
      const defaultMatch = email.match(/^admin@isbmun\.com$/);
      if (defaultMatch) {
        return 'Admin';
      }
      
      const namedMatch = email.match(/^([a-z0-9_\.-]+)-admin@isbmun\.com$/);
      if (namedMatch && namedMatch[1]) {
        // Capitalize the first letter of each word in the name
        return namedMatch[1]
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      
      return null;
    }
  },
  
  // Chair email format: chair-COUNCILNAME@isbmun.com
  CHAIR: {
    FORMAT: (council: string) => `chair-${council.toLowerCase()}@${EMAIL_DOMAIN}`,
    PATTERN: /^chair-([a-z0-9_\.-]+)@isbmun\.com$/,
    // Function to extract council name from chair email
    extractCouncil: (email: string): string | null => {
      const match = email.match(/^chair-([a-z0-9_\.-]+)@isbmun\.com$/);
      return match ? match[1].toUpperCase() : null;
    }
  },
  
  // Press email formats:
  // 1. press@isbmun.com (generic press)
  // 2. press-NAME@isbmun.com (named press member)
  PRESS: {
    DEFAULT: `press@${EMAIL_DOMAIN}`,
    NAMED: (name: string) => `press-${name.toLowerCase()}@${EMAIL_DOMAIN}`,
    PATTERN_DEFAULT: /^press@isbmun\.com$/,
    PATTERN_NAMED: /^press-([a-z0-9_\.-]+)@isbmun\.com$/,
    // Function to extract name from press email
    extractName: (email: string): string | null => {
      const defaultMatch = email.match(/^press@isbmun\.com$/);
      if (defaultMatch) {
        return 'Press';
      }
      
      const namedMatch = email.match(/^press-([a-z0-9_\.-]+)@isbmun\.com$/);
      if (namedMatch && namedMatch[1]) {
        return namedMatch[1].charAt(0).toUpperCase() + namedMatch[1].slice(1);
      }
      
      return null;
    }
  }
};

/**
 * Function to determine user role and additional info from email
 * Returns role, council/name, and username based on email format
 */
export const getUserInfoFromEmail = (email: string): {
  role: 'admin' | 'chair';
  council?: string;
  username: string;
} => {
  email = email.toLowerCase();
  
  // Check if email matches any admin pattern
  if (
    EMAIL_FORMATS.ADMIN.PATTERN_DEFAULT.test(email) ||
    EMAIL_FORMATS.ADMIN.PATTERN_NAMED.test(email)
  ) {
    const adminName = EMAIL_FORMATS.ADMIN.extractName(email) || 'Admin';
    return {
      role: 'admin',
      username: adminName
    };
  }
  
  // Check if email matches chair pattern
  const chairCouncilMatch = email.match(EMAIL_FORMATS.CHAIR.PATTERN);
  if (chairCouncilMatch && chairCouncilMatch[1]) {
    const council = chairCouncilMatch[1].toUpperCase();
    return {
      role: 'chair',
      council,
      username: council // Use council name as username
    };
  }
  
  // Check if email matches any press pattern
  if (
    EMAIL_FORMATS.PRESS.PATTERN_DEFAULT.test(email) ||
    EMAIL_FORMATS.PRESS.PATTERN_NAMED.test(email)
  ) {
    const pressName = EMAIL_FORMATS.PRESS.extractName(email) || 'Press';
    return {
      role: 'chair', // Press users have same access as chair
      council: 'PRESS',
      username: pressName
    };
  }
  
  // Fallback if no pattern matches
  return {
    role: 'chair', // Default to chair
    username: email.split('@')[0]
  };
};

/**
 * Validation function to check if an email follows any of the defined patterns
 */
export const isValidAppEmail = (email: string): boolean => {
  email = email.toLowerCase();
  
  // Check against all patterns
  return (
    EMAIL_FORMATS.ADMIN.PATTERN_DEFAULT.test(email) ||
    EMAIL_FORMATS.ADMIN.PATTERN_NAMED.test(email) ||
    EMAIL_FORMATS.CHAIR.PATTERN.test(email) ||
    EMAIL_FORMATS.PRESS.PATTERN_DEFAULT.test(email) ||
    EMAIL_FORMATS.PRESS.PATTERN_NAMED.test(email) ||
    email.endsWith(`@${EMAIL_DOMAIN}`) // Generic fallback for any email with the correct domain
  );
};

export default {
  EMAIL_DOMAIN,
  EMAIL_FORMATS,
  getUserInfoFromEmail,
  isValidAppEmail
};
