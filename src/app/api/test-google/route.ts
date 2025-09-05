/**
 * @license MIT
 * Test Google Calendar connection
 */

import { requireApiKey } from "@/lib/auth";
import { getCalendar } from "@/lib/google";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    requireApiKey(request);

    // Test Google Calendar connection
    const calendar = await getCalendar();

    // Try to list calendars
    const calendarList = await calendar.calendarList.list();

    return NextResponse.json({
      success: true,
      calendarCount: calendarList.data.items?.length || 0,
      calendars:
        calendarList.data.items?.map((cal) => ({
          id: cal.id,
          summary: cal.summary,
        })) || [],
    });
  } catch (error) {
    console.error("Test Google error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      },
      { status: 500 }
    );
  }
}
