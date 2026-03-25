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

  try {
    await withTimeout(
      transporter.sendMail(mailOptions),
      EMAIL_SEND_TIMEOUT_MS,
      `Email send timed out after ${EMAIL_SEND_TIMEOUT_MS / 1000}s. On cloud hosts try SMTP_PORT=587 and SMTP_SECURE=false.`
    );
  } catch (err) {
    const raw = (err && err.message) || String(err);
    const lower = raw.toLowerCase();
    if (
      lower.includes("connection timeout") ||
      lower.includes("etimedout") ||
      lower.includes("econnrefused") ||
      lower.includes("greeting never received")
    ) {
      throw new Error(
        "Email server connection failed. On Render/production: use SMTP_PORT=587, SMTP_SECURE=false, SMTP_HOST=smtp.gmail.com, and a Gmail App Password. Outbound port 465 is often blocked."
      );
    }
    throw err;
  }
};

export const sendMessage = {
  sendEmail,
  sendSms,
};
