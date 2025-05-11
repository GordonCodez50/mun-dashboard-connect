
import { UserRole } from '@/types/auth';

// Define email format patterns
export const EMAIL_FORMATS = {
  // Admin formats
  ADMIN: {
    DIRECT: 'admin@isbmun.com',
    PREFIX: 'admin-', // For admin-name@isbmun.com
    SUFFIX: '-admin'  // For name-admin@isbmun.com
  },
  
  // Chair format
  CHAIR: {
    PREFIX: 'chair-' // For chair-councilname@isbmun.com
  },
  
  // Press format
  PRESS: {
    PREFIX: 'press-' // For press-name@isbmun.com
  },
  
  // Common domain
  DOMAIN: '@isbmun.com'
};

/**
 * Gets user information from an email address based on the email format
 */
export const getUserInfoFromEmail = (email: string): { 
  role: UserRole;
  council?: string;
  username: string;
} => {
  email = email.toLowerCase();
  
  // Direct admin email
  if (email === EMAIL_FORMATS.ADMIN.DIRECT) {
    return {
      role: 'admin',
      council: undefined,
      username: 'Admin'
    };
  }
  
  // Name-admin format (name-admin@isbmun.com)
  if (email.includes(EMAIL_FORMATS.ADMIN.SUFFIX + EMAIL_FORMATS.DOMAIN)) {
    const namePart = email.split(EMAIL_FORMATS.ADMIN.SUFFIX)[0];
    return {
      role: 'admin',
      council: undefined,
      username: namePart.charAt(0).toUpperCase() + namePart.slice(1) // Capitalize name
    };
  }
  
  // Admin-name format (admin-name@isbmun.com)
  if (email.startsWith(EMAIL_FORMATS.ADMIN.PREFIX)) {
    const namePart = email.substring(EMAIL_FORMATS.ADMIN.PREFIX.length);
    const name = namePart.split('@')[0];
    return {
      role: 'admin',
      council: undefined,
      username: name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Admin' // Capitalize name or use default
    };
  }
  
  // Chair format (chair-councilname@isbmun.com)
  if (email.startsWith(EMAIL_FORMATS.CHAIR.PREFIX)) {
    const councilPart = email.substring(EMAIL_FORMATS.CHAIR.PREFIX.length);
    const council = councilPart.split('@')[0].toUpperCase();
    return { 
      role: 'chair',
      council,
      username: council // Use council name as username
    };
  }
  
  // Press format (press-name@isbmun.com)
  if (email.startsWith(EMAIL_FORMATS.PRESS.PREFIX)) {
    const namePart = email.substring(EMAIL_FORMATS.PRESS.PREFIX.length);
    const name = namePart.split('@')[0];
    return {
      role: 'chair', // Press users have same access as chair
      council: 'PRESS',
      username: name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Press' // Capitalize name or use default
    };
  }
  
  // Legacy compatibility checks
  if (email === 'admin@example.com') {
    return {
      role: 'admin',
      council: undefined,
      username: 'Admin'
    };
  }
  
  if (email === 'press@example.com') {
    return {
      role: 'chair',
      council: 'PRESS',
      username: 'Press'
    };
  }
  
  // Default fallback
  return {
    role: 'chair',
    council: undefined,
    username: email.split('@')[0]
  };
};

/**
 * Checks if an email follows admin email pattern
 */
export const isAdminEmail = (email: string): boolean => {
  email = email.toLowerCase();
  return (
    email === EMAIL_FORMATS.ADMIN.DIRECT || 
    email.startsWith(EMAIL_FORMATS.ADMIN.PREFIX) ||
    email.includes(EMAIL_FORMATS.ADMIN.SUFFIX + EMAIL_FORMATS.DOMAIN)
  );
};

/**
 * Checks if an email follows chair email pattern
 */
export const isChairEmail = (email: string): boolean => {
  email = email.toLowerCase();
  return email.startsWith(EMAIL_FORMATS.CHAIR.PREFIX);
};

/**
 * Checks if an email follows press email pattern
 */
export const isPressEmail = (email: string): boolean => {
  email = email.toLowerCase();
  return email.startsWith(EMAIL_FORMATS.PRESS.PREFIX);
};

/**
 * Extracts council name from chair email
 */
export const extractCouncilFromEmail = (email: string): string | undefined => {
  if (!isChairEmail(email)) return undefined;
  
  email = email.toLowerCase();
  const councilPart = email.substring(EMAIL_FORMATS.CHAIR.PREFIX.length);
  return councilPart.split('@')[0].toUpperCase();
};

/**
 * Extracts name from admin or press email
 */
export const extractNameFromEmail = (email: string): string => {
  email = email.toLowerCase();
  
  // Handle name-admin@isbmun.com format
  if (email.includes(EMAIL_FORMATS.ADMIN.SUFFIX + EMAIL_FORMATS.DOMAIN)) {
    const namePart = email.split(EMAIL_FORMATS.ADMIN.SUFFIX)[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  }
  
  // Handle admin-name@isbmun.com format
  if (email.startsWith(EMAIL_FORMATS.ADMIN.PREFIX)) {
    const namePart = email.substring(EMAIL_FORMATS.ADMIN.PREFIX.length);
    const name = namePart.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  
  // Handle press-name@isbmun.com format
  if (email.startsWith(EMAIL_FORMATS.PRESS.PREFIX)) {
    const namePart = email.substring(EMAIL_FORMATS.PRESS.PREFIX.length);
    const name = namePart.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  
  // Default
  return email.split('@')[0];
};
