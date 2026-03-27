import { google } from "googleapis";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { fileURLToPath } from "url";
import logger from "../utils/logger.js";

dotenv.config();

/** ESM: `__dirname` is not defined; derive from import.meta.url */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize Google Drive API client
 * Supports OAuth2, service account JSON file, and service account env vars.
 * Uses `drive` scope to support both personal and shared drives.
 */
export const initDriveClient = () => {
  try {
    // Method 1: OAuth2 (recommended for personal Gmail — avoids service-account storage quota limits)
    if (
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
    ) {
      logger.info("Using credentials from OAuth2 (Environment Variables)");

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI ||
          "https://developers.google.com/oauthplayground"
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });

      const drive = google.drive({ version: "v3", auth: oauth2Client });
      return drive;
    }

    // Method 2: Service account JSON file (project root)
    const GOOGLE_ACCOUNT_SDK_FILE =
      process.env.GOOGLE_ACCOUNT_SDK_FILE ||
      "wscengineer-f61a0-firebase-adminsdk.json";
    const credentialsPath = path.join(
      __dirname,
      "..",
      "..",
      GOOGLE_ACCOUNT_SDK_FILE
    );

    if (fs.existsSync(credentialsPath)) {
      logger.info("Using credentials from JSON file");

      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ["https://www.googleapis.com/auth/drive"],
      });

      const drive = google.drive({ version: "v3", auth });
      return drive;
    }

    // Method 3: Service account via environment variables
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      logger.info("Using credentials from environment variables");

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/drive"],
      });

      const drive = google.drive({ version: "v3", auth });
      return drive;
    }

    throw new Error(
      "No valid Google Drive credentials found. Please provide either credentials.json or environment variables."
    );
  } catch (error) {
    logger.error("Error initializing Google Drive client:", error);
    throw error;
  }
};
