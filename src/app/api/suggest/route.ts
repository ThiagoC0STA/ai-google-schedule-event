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
  workHours: z
    .tuple([z.number().min(0).max(23), z.number().min(0).max(23)])
    .default([9, 18]),
  bufferMin: z.number().min(0).max(60).default(10),
  calendarId: z
    .string()
    .default(
      "c_38c39f72ffd161460d8166a7fc705488275ac62ffb3c7471af98bf900e17c24e@group.calendar.google.com"
    ),
  tz: z.string().default(process.env.TIMEZONE || DEFAULT_TZ),
});

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    requireApiKey(request);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = suggestSchema.parse(body);

    const { requestedStartISO, workHours, bufferMin, calendarId, tz } =
      validatedData;

    // Parse requested time and calculate end time (30 minutes later)
    const requestedStart = toDateTime(requestedStartISO, tz);
    const requestedEnd = requestedStart.plus({ minutes: 30 });

    // Get current time in specified timezone
    const currentTime = now(tz);
    const timeMax = currentTime.plus({ days: 30 }); // Buscar por 30 dias

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
      30, // 30 dias fixo
      workHours,
      30, // 30 minutos fixo
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

    // Take first 5 suggestions (sempre 5)
    const suggestions = sortedSlots.slice(0, 5);

    // Format response
    const slots = suggestions.map((slot) => ({
      start: toISOString(slot.start!),
      end: toISOString(slot.end!),
      duration: 30, // 30 minutos fixo
    }));

    return NextResponse.json({
      requestedTime: {
        start: requestedStartISO,
        end: toISOString(requestedEnd),
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
