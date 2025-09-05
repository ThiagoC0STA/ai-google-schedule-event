/**
 * @license MIT
 * Test environment variables
 */

import { requireApiKey } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    requireApiKey(request);

    return NextResponse.json({
      success: true,
      env: {
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN,
        clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "...",
        hasApiKey: !!process.env.INTERNAL_API_KEY,
        hasTz: !!process.env.TZ,
      },
    });
  } catch (error) {
    console.error("Test env error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
