/**
 * @license MIT
 * Cancel endpoint - deletes a calendar event
 */

import { requireApiKey } from "@/lib/auth";
import { getCalendar } from "@/lib/google";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Request body validation schema
const cancelSchema = z.object({
  eventId: z.string().min(1),
  calendarId: z.string().default("primary"),
});

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    requireApiKey(request);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = cancelSchema.parse(body);

    const { eventId, calendarId } = validatedData;

    // Get Google Calendar client
    const calendar = await getCalendar();

    // Delete the event
    await calendar.events.delete({
      calendarId,
      eventId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Cancel endpoint error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle specific Google Calendar errors
    if (error instanceof Error && error.message.includes("404")) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
