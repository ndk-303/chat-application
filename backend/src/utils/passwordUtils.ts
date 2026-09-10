import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT = 10;

export const hashPassword = async (password: string): Promise<string> => {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT);
    return hashedPassword;
  } catch (error) {
    throw new Error('Error hashing password');
  }
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

/**
 * Generate a cryptographically secure password-reset token (32 random bytes as hex).
 * Previously used Math.random() (6-digit) which was brute-forceable.
 */
export const generateResetPwdToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/** Reset token expires in 1 hour (matches what the email template states). */
export const generateResetExpiration = (): Date => {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 1);
  return expiration;
};