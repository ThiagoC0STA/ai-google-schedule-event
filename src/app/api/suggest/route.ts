/**
 * @license MIT
 * Suggest alternative time slots when requested time is unavailable
 */

import { requireApiKey } from "@/lib/auth";
import { DEFAULT_TZ, getCalendar } from "@/lib/google";
import {
  filterFutureSlots,
  generateMultiDaySlots,
  hasConflict,
  now,
  toDateTime,
  toISOString,
} from "@/lib/time";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Request body validation schema
const suggestSchema = z.object({
  requestedStartISO: z.string(),
  requestedEndISO: z.string(),
  days: z.number().min(1).max(30).default(7),
  durationMin: z.number().min(15).max(480).default(45),
  workHours: z
    .tuple([z.number().min(0).max(23), z.number().min(0).max(23)])
    .default([9, 18]),
  bufferMin: z.number().min(0).max(60).default(10),
  calendarId: z.string().default("primary"),
  tz: z.string().default(process.env.TZ || DEFAULT_TZ),
  maxSuggestions: z.number().min(1).max(10).default(5),
});

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    requireApiKey(request);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = suggestSchema.parse(body);

    const {
      requestedStartISO,
      requestedEndISO,
      days,
      durationMin,
      workHours,
      bufferMin,
      calendarId,
      tz,
      maxSuggestions,
    } = validatedData;

    // Parse requested times
    const requestedStart = toDateTime(requestedStartISO, tz);
    const requestedEnd = toDateTime(requestedEndISO, tz);

    // Validate time order
    if (requestedStart >= requestedEnd) {
      return NextResponse.json(
        { error: "Requested start time must be before end time" },
        { status: 400 }
      );
    }

    // Get current time in specified timezone
    const currentTime = now(tz);
    const timeMax = currentTime.plus({ days });

    // Get Google Calendar client
    const calendar = await getCalendar();

    // Query free/busy information
    const freebusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: currentTime.toISO(),
        timeMax: timeMax.toISO(),
        timeZone: tz,
        items: [{ id: calendarId }],
      },
    });

    const busyPeriods =
      freebusyResponse.data.calendars?.[calendarId]?.busy || [];

    // Generate all possible slots for the specified period
    const allSlots = generateMultiDaySlots(
      currentTime.startOf("day"),
      days,
      workHours,
      durationMin,
      bufferMin
    );

    // Filter out past slots
    const futureSlots = filterFutureSlots(allSlots, currentTime);

    // Filter out slots that conflict with busy periods
    const availableSlots = futureSlots.filter(
      (slot) =>
        !hasConflict(
          slot,
          busyPeriods.filter((period) => period.start && period.end) as Array<{
            start: string;
            end: string;
          }>,
          tz
        )
    );

    // Sort by proximity to requested time
    const sortedSlots = availableSlots.sort((a, b) => {
      const aDistance = Math.abs(
        a.start!.toMillis() - requestedStart.toMillis()
      );
      const bDistance = Math.abs(
        b.start!.toMillis() - requestedStart.toMillis()
      );
      return aDistance - bDistance;
    });

    // Take first N suggestions
    const suggestions = sortedSlots.slice(0, maxSuggestions);

    // Format response
    const slots = suggestions.map((slot) => ({
      start: toISOString(slot.start!),
      end: toISOString(slot.end!),
      duration: durationMin,
    }));

    return NextResponse.json({
      requestedTime: {
        start: requestedStartISO,
        end: requestedEndISO,
      },
      timeZone: tz,
      suggestions: slots,
      totalAvailable: availableSlots.length,
    });
  } catch (error) {
    console.error("Suggest endpoint error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
