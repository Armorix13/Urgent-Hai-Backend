import {
  accountSid,
  authToken,
  fromPhoneNumber,
  user,
  pass,
} from "../config/index.js";
import Twilio from "twilio";
import nodemailer from "nodemailer";

const EMAIL_SEND_TIMEOUT_MS = 20000;

const sendSms = async ({ to, body }) => {
  if (!accountSid || !authToken || !fromPhoneNumber) {
    throw new Error("Missing Twilio credentials");
  }
  const client = new Twilio(accountSid, authToken);
  try {
    const message = await client.messages.create({
      body,
      to,
      from: fromPhoneNumber,
    });
    console.log(`Message sent with SID: ${message.sid}`);
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
};

const getTransporter = () => {
  if (!user || !pass) {
    return null;
  }
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure =
    process.env.SMTP_SECURE === "true" ||
    (process.env.SMTP_SECURE !== "false" && port === 465);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure,
    requireTLS: port === 587,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

function withTimeout(promise, ms, message) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

const sendEmail = async ({ userEmail, subject, text, html }) => {
  if (!user || !pass) {
    throw new Error(
      "Email service is not configured. Set SMTP_EMAIL and SMTP_PASSWORD in environment."
    );
  }

  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("Email transporter could not be created.");
  }

  const fromAddress = process.env.SMTP_EMAIL || user;
  const mailOptions = {
    from: fromAddress,
    to: userEmail,
    subject,
    text,
    html,
  };

  await withTimeout(
    transporter.sendMail(mailOptions),
    EMAIL_SEND_TIMEOUT_MS,
    `Email send timed out after ${EMAIL_SEND_TIMEOUT_MS / 1000}s. Check SMTP settings, firewall, and network.`
  );
};

export const sendMessage = {
  sendEmail,
  sendSms,
};
