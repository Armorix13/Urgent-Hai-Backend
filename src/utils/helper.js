import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();

const saltRounds = 10;

/**
 * Generates a random OTP of a given length
 * @param length - The desired length of the OTP (e.g., 6 for a 6-digit OTP)
 * @returns The generated OTP as a string
 */
const generateOtp = (length) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString(); // Random digit between 0 and 9
  }
  return otp;
};

/**
 * Hashes a plain text password
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
async function hashPassword(password) {
  // Using bcrypt to hash the password
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

/**
 * Verifies if the plain text password matches the hashed password
 * @param password - Plain text password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns `true` if passwords match, `false` otherwise
 */
async function verifyPassword(password, hashedPassword) {
  // Using bcrypt to compare the plain password with the hashed one
  const match = await bcrypt.compare(password, hashedPassword);
  return match;
}

/**
 * Generates a JSON Web Token (JWT) for a given payload (user information)
 * @param payload - Payload data to encode in the JWT (e.g., user ID)
 * @param type - Token type to generate ('access' or 'refresh')
 * @returns Generated JWT token as a string
 */
function generateToken(payload, type) {
  const secretKey = process.env.JWT_SECRET_KEY;
  let expiresIn;
  if (type === 'access') {
    expiresIn = '1d';
  } else if (type === 'refresh') {
    expiresIn = '7d';
  } else {
    throw new Error('Invalid token type');
  }
  const token = JWT.sign(payload, secretKey, {
    expiresIn,
  });
  return token;
}

/**
 * Verifies a JWT and decodes its payload
 * @param token - JWT token to verify
 * @returns Decoded token payload if valid, throws error if invalid
 */
async function verifyToken(token) {
  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET_KEY);
    return decoded;
  } catch (error) {
    throw error;
  }
}

const TryCatch = (func) => (req, res, next) =>
  Promise.resolve(func(req, res, next)).catch(next);

const generateRandomJti = (length = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let jti = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    jti += characters[randomIndex];
  }

  return jti;
};

const isValidDateRange = async (date) => {
  const today = new Date();
  return date >= today;
};

const addMinutesToCurrentTime = (minutes) => {
    return new Date().getTime() + minutes * 60000; 
  };

export const helper = {
  addMinutesToCurrentTime,
  generateOtp,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  TryCatch,
  generateRandomJti,
  isValidDateRange,
};
