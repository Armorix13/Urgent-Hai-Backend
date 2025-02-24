import dotenv from 'dotenv';
dotenv.config();

export const MONGO_URI = process.env.MONGO_URI;
export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';

export const accountSid = process.env.TWILIO_ACCOUNT_SID;
export const authToken = process.env.TWILIO_AUTH_TOKEN;
export const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

export const user = process.env.SMTP_EMAIL;
export const pass = process.env.SMTP_PASSWORD;