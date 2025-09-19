/**
 * @license MIT
 * Book endpoint - creates calendar event with Google Meet link
 */

import { requireApiKey } from "@/lib/auth";
import { DEFAULT_TZ, getCalendar } from "@/lib/google";
import { hasConflict, toDateTime } from "@/lib/time";
import { Interval } from "luxon";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Request body validation schema
const bookSchema = z.object({
  startISO: z.string(),
  attendeeEmail: z.string().email().nullable().optional(),
  title: z.string().default("Call Bland AI"),
  description: z.string().nullable().optional(),
  calendarId: z
    .string()
    .default(
      "c_38c39f72ffd161460d8166a7fc705488275ac62ffb3c7471af98bf900e17c24e@group.calendar.google.com"
    ),
  tz: z.string().default(process.env.TIMEZONE || DEFAULT_TZ),
  recheck: z.boolean().default(true),
});

console.log("BOOK API - Request received" + bookSchema.toString());

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    requireApiKey(request);

    // Parse and validate request body
    const body = await request.json();
    console.log(
      "📥 BOOK API - Raw request body:",
      JSON.stringify(body, null, 2)
    );

    const validatedData = bookSchema.parse(body);
    console.log(
      "✅ BOOK API - Validated data:",
      JSON.stringify(validatedData, null, 2)
    );

    const {
      startISO,
      attendeeEmail,
      title,
      description,
      calendarId,
      tz,
      recheck,
    } = validatedData;

    console.log("🌍 BOOK API - Timezone info:");
    console.log("  - process.env.TIMEZONE:", process.env.TIMEZONE);
    console.log("  - DEFAULT_TZ:", DEFAULT_TZ);
    console.log("  - Final tz used:", tz);
    console.log("  - startISO received:", startISO);

    // Parse start time and calculate end time (30 minutes later)
    const startTime = toDateTime(startISO, tz);
    const endTime = startTime.plus({ minutes: 30 });

    console.log("⏰ BOOK API - Time processing:");
    console.log("  - startTime.toISO():", startTime.toISO());
    console.log("  - startTime.toString():", startTime.toString());
    console.log("  - startTime.zoneName:", startTime.zoneName);
    console.log("  - endTime.toISO():", endTime.toISO());
    console.log("  - endTime.toString():", endTime.toString());
    console.log("  - endTime.zoneName:", endTime.zoneName);

    // Get Google Calendar client
    const calendar = await getCalendar();

    // Recheck availability if requested
    if (recheck) {
      const freebusyResponse = await calendar.freebusy.query({
        requestBody: {
          timeMin: startTime.minus({ minutes: 10 }).toISO(),
          timeMax: endTime.plus({ minutes: 10 }).toISO(),
          timeZone: tz,
          items: [{ id: calendarId }],
        },
      });

      const busyPeriods =
        freebusyResponse.data.calendars?.[calendarId]?.busy || [];

      // Check for conflicts with buffer
      const slotInterval = Interval.fromDateTimes(startTime, endTime);
      if (
        hasConflict(
          slotInterval,
          busyPeriods.filter((period) => period.start && period.end) as Array<{
            start: string;
            end: string;
          }>,
          tz
        )
      ) {
        return NextResponse.json(
          { error: "Time slot is no longer available" },
          { status: 409 }
        );
      }
    }

    // Generate unique request ID for Meet
    const requestId = `meet-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Prepare event data
    const eventData: {
      summary: string;
      description?: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      conferenceData: {
        createRequest: {
          requestId: string;
          conferenceSolutionKey: { type: string };
        };
      };
      conferenceDataVersion: number;
      attendees?: Array<{ email: string; responseStatus: string }>;
    } = {
      summary: title,
      description: description || undefined,
      start: {
        dateTime: startTime.toISO() || startTime.toString(),
        timeZone: tz,
      },
      end: {
        dateTime: endTime.toISO() || endTime.toString(),
        timeZone: tz,
      },
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
      conferenceDataVersion: 1,
    };

    console.log("📅 BOOK API - Event data to be created:");
    console.log("  - Event summary:", eventData.summary);
    console.log("  - Start dateTime:", eventData.start.dateTime);
    console.log("  - Start timeZone:", eventData.start.timeZone);
    console.log("  - End dateTime:", eventData.end.dateTime);
    console.log("  - End timeZone:", eventData.end.timeZone);
    console.log("  - Calendar ID:", calendarId);

    // Add attendee if provided
    if (attendeeEmail) {
      eventData.attendees = [
        {
          email: attendeeEmail,
          responseStatus: "needsAction",
        },
      ];
    }

    // Create the event
    const eventResponse = await calendar.events.insert({
      calendarId,
      requestBody: eventData,
      conferenceDataVersion: 1,
    });

    const event = eventResponse.data;

    if (!event) {
      throw new Error("Failed to create event");
    }

    // Extract Meet link
    const meetLink = event.conferenceData?.entryPoints?.find(
      (entry) => entry.entryPointType === "video"
    )?.uri;

    if (!meetLink) {
      console.warn("Google Meet link not found in event response");
    }

    return NextResponse.json({
      eventId: event.id,
      meetLink: meetLink || null,
      htmlLink: event.htmlLink || null,
    });
  } catch (error) {
    console.error("Book endpoint error:", error);

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
