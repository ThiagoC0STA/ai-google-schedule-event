/**
 * @license MIT
 * Test endpoint to verify OAuth2 credentials
 */

import { requireApiKey } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Validate API key
    requireApiKey(request);

    // Check if OAuth2 credentials are loaded
    const hasOAuth2 = !!(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
    );

    const hasServiceAccount = !!(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_IMPERSONATE_EMAIL
    );

    return NextResponse.json({
      oauth2: hasOAuth2,
      serviceAccount: hasServiceAccount,
      clientId: process.env.GOOGLE_CLIENT_ID ? "loaded" : "missing",
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN ? "loaded" : "missing",
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
