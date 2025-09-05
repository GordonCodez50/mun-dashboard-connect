/**
 * Generates a secure 9-character password with mixed case letters, numbers, and special characters
 */
export const generatePassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specials = '!@#$%^&*';
  
  // Ensure password has at least one character from each category
  const required = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    specials[Math.floor(Math.random() * specials.length)]
  ];
  
  // Fill remaining 5 characters with random selection from all categories
  const allChars = uppercase + lowercase + numbers + specials;
  const remaining = Array.from({ length: 5 }, () => 
    allChars[Math.floor(Math.random() * allChars.length)]
  );
  
  // Combine and shuffle the password
  const password = [...required, ...remaining];
  
  // Fisher-Yates shuffle algorithm
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }
  
  return password.join('');
};

/**
 * Validates password strength (at least 9 characters with mixed character types)
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length < 9) {
    feedback.push('Password must be at least 9 characters long');
  } else {
    score += 20;
  }
  
  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 20;
  }
  
  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score += 20;
  }
  
  if (!/[0-9]/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 20;
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    feedback.push('Password must contain at least one special character (!@#$%^&*)');
  } else {
    score += 20;
  }
  
  return {
    isValid: score === 100,
    score,
    feedback
  };
};