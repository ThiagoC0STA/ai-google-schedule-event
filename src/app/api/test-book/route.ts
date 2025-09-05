/**
 * @license MIT
 * Test book endpoint - simplified version
 */

import { requireApiKey } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    requireApiKey(request);

    // Parse request body
    const body = await request.json();

    return NextResponse.json({
      success: true,
      received: body,
      message: "Test endpoint working",
    });
  } catch (error) {
    console.error("Test book endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
