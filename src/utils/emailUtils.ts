
/**
 * Extract the council name from a chair's email address
 * Example: chair-unhrc@isbmun.com → unhrc
 */
export const extractCouncilName = (email: string): string => {
  // Default value if extraction fails
  let councilName = 'council';
  
  // Try to extract from email format: chair-council@isbmun.com
  const match = email.match(/chair-([^@]+)@/);
  if (match && match[1]) {
    councilName = match[1].toLowerCase();
  } else if (email.includes('@')) {
    // Fallback: try to extract the username part before @
    councilName = email.split('@')[0].replace('chair-', '');
  }
  
  return councilName;
};

/**
 * Generate a print code based on council name and current date
 * Format: #<councilname><serial><total><d1/d2>
 */
export const generatePrintCode = (councilName: string): string => {
  const serial = '00'; // Static serial value
  const total = '00';  // Static total value
  
  // Determine d1 or d2 based on current date
  const today = new Date();
  const cutoffDate = new Date(today.getFullYear(), 4, 16); // May 16 (months are 0-indexed)
  const dateCode = today <= cutoffDate ? 'd1' : 'd2';
  
  return `#${councilName}${serial}${total}${dateCode}`;
};
