/**
 * @license MIT
 * Debug endpoint to test Google Calendar connection
 */

import { requireApiKey } from "@/lib/auth";
import { getCalendar } from "@/lib/google";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Validate API key
    requireApiKey(request);

    // Test Google Calendar connection
    const calendar = await getCalendar();

    // Try to list calendars
    const calendars = await calendar.calendarList.list();

    return NextResponse.json({
      success: true,
      calendarCount: calendars.data.items?.length || 0,
      calendars:
        calendars.data.items?.map((cal) => ({
          id: cal.id,
          summary: cal.summary,
          primary: cal.primary,
        })) || [],
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
