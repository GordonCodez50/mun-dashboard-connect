
import { UserRole } from '@/types/auth';

// Define email format patterns
export const EMAIL_FORMATS = {
  // Admin formats
  ADMIN: {
    DIRECT: 'admin@bmunis.com',
    PREFIX: 'admin-', // For admin-name@bmunis.com
    SUFFIX: '-admin'  // For name-admin@bmunis.com
  },
  
  // Chair format
  CHAIR: {
    PREFIX: 'chair-' // For chair-councilname@bmunis.com
  },
  
  // Press format
  PRESS: {
    PREFIX: 'press-' // For press-name@bmunis.com
  },
  
  // Logistics format
  LOGISTICS: {
    PREFIX: 'logistics-' // For logistics-name@bmunis.com
  },
  
  // R&T Admin format
  RT_ADMIN: {
    PREFIX: 'rt-admin-' // For rt-admin-name@bmunis.com
  },
  
  // Member formats
  MEMBER_HCC: {
    PREFIX: 'member-hcc-' // For member-hcc-name@bmunis.com
  },
  
  MEMBER_FCC: {
    PREFIX: 'member-fcc-' // For member-fcc-name@bmunis.com
  },
  
  // Common domain
  DOMAIN: '@bmunis.com'
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
  
  // R&T Admin format (rt-admin-name@bmunis.com) - Check BEFORE generic admin
  if (email.startsWith(EMAIL_FORMATS.RT_ADMIN.PREFIX)) {
    const namePart = email.substring(EMAIL_FORMATS.RT_ADMIN.PREFIX.length);
    const name = namePart.split('@')[0];
    return {
      role: 'admin-rt',
      council: undefined,
      username: name ? name.charAt(0).toUpperCase() + name.slice(1) : 'RT Admin'
    };
  }
  
  // Name-admin format (name-admin@bmunis.com)
  if (email.includes(EMAIL_FORMATS.ADMIN.SUFFIX + EMAIL_FORMATS.DOMAIN)) {
    const namePart = email.split(EMAIL_FORMATS.ADMIN.SUFFIX)[0];
    return {
      role: 'admin',
      council: undefined,
      username: namePart.charAt(0).toUpperCase() + namePart.slice(1) // Capitalize name
    };
  }
  
  // Admin-name format (admin-name@bmunis.com)
  if (email.startsWith(EMAIL_FORMATS.ADMIN.PREFIX)) {
    const namePart = email.substring(EMAIL_FORMATS.ADMIN.PREFIX.length);
    const name = namePart.split('@')[0];
    return {
      role: 'admin',
      council: undefined,
      username: name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Admin' // Capitalize name or use default
    };
  }
  
  // Chair format (chair-councilname@bmunis.com)
  if (email.startsWith(EMAIL_FORMATS.CHAIR.PREFIX)) {
    const councilPart = email.substring(EMAIL_FORMATS.CHAIR.PREFIX.length);
    const council = councilPart.split('@')[0].toUpperCase();
    return { 
      role: 'chair',
      council,
      username: council // Use council name as username
    };
  }
  
  // Press format (press-name@bmunis.com)
  if (email.startsWith(EMAIL_FORMATS.PRESS.PREFIX)) {
    const namePart = email.substring(EMAIL_FORMATS.PRESS.PREFIX.length);
    const name = namePart.split('@')[0];
    return {
      role: 'chair', // Press users have chair access but with PRESS council
      council: 'PRESS',
      username: name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Press' // Capitalize name or use default
    };
  }
  
  // Logistics format (logistics-name@bmunis.com)
  if (email.startsWith(EMAIL_FORMATS.LOGISTICS.PREFIX)) {
    const namePart = email.substring(EMAIL_FORMATS.LOGISTICS.PREFIX.length);
    const name = namePart.split('@')[0];
    return {
      role: 'logistics',
      council: undefined, // Can be assigned to specific councils later
      username: name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Logistics' // Capitalize name or use default
    };
  }
  
  // This R&T Admin check was moved above to prevent conflicts with generic admin parsing
  
  // Member HCC format (member-hcc-name@bmunis.com)
  if (email.startsWith(EMAIL_FORMATS.MEMBER_HCC.PREFIX)) {
    const namePart = email.substring(EMAIL_FORMATS.MEMBER_HCC.PREFIX.length);
    const name = namePart.split('@')[0];
    return {
      role: 'member-hcc',
      council: 'HCC',
      username: name ? name.charAt(0).toUpperCase() + name.slice(1) : 'HCC Member'
    };
  }
  
  // Member FCC format (member-fcc-name@bmunis.com)
  if (email.startsWith(EMAIL_FORMATS.MEMBER_FCC.PREFIX)) {
    const namePart = email.substring(EMAIL_FORMATS.MEMBER_FCC.PREFIX.length);
    const name = namePart.split('@')[0];
    return {
      role: 'member-fcc',
      council: 'FCC',
      username: name ? name.charAt(0).toUpperCase() + name.slice(1) : 'FCC Member'
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
 * Checks if an email follows logistics email pattern
 */
export const isLogisticsEmail = (email: string): boolean => {
  email = email.toLowerCase();
  return email.startsWith(EMAIL_FORMATS.LOGISTICS.PREFIX);
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
  
  // Handle name-admin@bmunis.com format
  if (email.includes(EMAIL_FORMATS.ADMIN.SUFFIX + EMAIL_FORMATS.DOMAIN)) {
    const namePart = email.split(EMAIL_FORMATS.ADMIN.SUFFIX)[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  }
  
  // Handle admin-name@bmunis.com format
  if (email.startsWith(EMAIL_FORMATS.ADMIN.PREFIX)) {
    const namePart = email.substring(EMAIL_FORMATS.ADMIN.PREFIX.length);
    const name = namePart.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  
  // Handle press-name@bmunis.com format
  if (email.startsWith(EMAIL_FORMATS.PRESS.PREFIX)) {
    const namePart = email.substring(EMAIL_FORMATS.PRESS.PREFIX.length);
    const name = namePart.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  
  // Handle logistics-name@bmunis.com format
  if (email.startsWith(EMAIL_FORMATS.LOGISTICS.PREFIX)) {
    const namePart = email.substring(EMAIL_FORMATS.LOGISTICS.PREFIX.length);
    const name = namePart.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  
  // Default
  return email.split('@')[0];
};
