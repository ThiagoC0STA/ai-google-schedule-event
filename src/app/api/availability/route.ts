/**
 * @license MIT
 * Availability endpoint - returns next 3 available time slots
 */

import { requireApiKey } from "@/lib/auth";
import { DEFAULT_TZ, getCalendar } from "@/lib/google";
import {
  filterFutureSlots,
  generateMultiDaySlots,
  hasConflict,
  now,
  toISOString,
} from "@/lib/time";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Request body validation schema
const availabilitySchema = z.object({
  days: z.number().min(1).max(30).default(7),
  durationMin: z.number().min(15).max(480).default(45),
  workHours: z
    .tuple([z.number().min(0).max(23), z.number().min(0).max(23)])
    .default([9, 18]),
  bufferMin: z.number().min(0).max(60).default(10),
  calendarId: z.string().default("primary"),
  tz: z.string().default(process.env.TIMEZONE || DEFAULT_TZ),
});

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    requireApiKey(request);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = availabilitySchema.parse(body);

    const { days, durationMin, workHours, bufferMin, calendarId, tz } =
      validatedData;

    // Validate work hours
    if (workHours[0] >= workHours[1]) {
      return NextResponse.json(
        { error: "Invalid work hours: start hour must be before end hour" },
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

    // Sort by start time and take first 3
    const sortedSlots = availableSlots
      .sort((a, b) => a.start!.toMillis() - b.start!.toMillis())
      .slice(0, 3);

    // Format response
    const slots = sortedSlots.map((slot) => ({
      start: toISOString(slot.start!),
      end: toISOString(slot.end!),
    }));

    return NextResponse.json({
      timeZone: tz,
      slots,
    });
  } catch (error) {
    console.error("Availability endpoint error:", error);

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
