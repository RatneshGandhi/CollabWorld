import bcrypt from 'bcrypt';

/**
 * Hashes a plaintext password with a salt round of 10
 * @param {string} password - Raw plaintext password
 * @returns {Promise<string>} Hashed password string
 */
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compares a plaintext password against a stored bcrypt hash
 * @param {string} candidatePassword - Password provided by user during login
 * @param {string} hashedPassword - Hashed password stored in database
 * @returns {Promise<boolean>} True if match, false otherwise
 */
export const comparePassword = async (candidatePassword, hashedPassword) => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};