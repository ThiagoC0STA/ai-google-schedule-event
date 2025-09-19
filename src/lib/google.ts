/**
 * @license MIT
 * Google Calendar API authentication and client setup
 */

import { google } from "googleapis";

// Default timezone
export const DEFAULT_TZ = process.env.TIMEZONE || "America/Los_Angeles";

/**
 * Get Google Calendar client with appropriate authentication
 * Supports both Service Account and OAuth2 authentication
 */
export async function getCalendar() {
  try {
    // Use OAuth2 with refresh token for Gmail accounts (NUNCA EXPIRA se configurado corretamente)
    if (
      process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
      process.env.GOOGLE_OAUTH_REFRESH_TOKEN
    ) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
      });

      return google.calendar({ version: "v3", auth: oauth2Client });
    }

    // Fallback to Service Account (only works with Workspace)
    if (
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY
    ) {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/calendar"],
      });

      const authClient: any = await auth.getClient();
      return google.calendar({ version: "v3", auth: authClient });
    }

    throw new Error("No valid Google authentication credentials found");
  } catch (error) {
    console.error("Failed to initialize Google Calendar client:", error);
    throw new Error("Google Calendar authentication failed");
  }
}
