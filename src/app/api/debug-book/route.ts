/**
 * @license MIT
 * Debug book endpoint - shows validation errors
 */

import { requireApiKey } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Request body validation schema (same as book endpoint)
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
  tz: z.string().default("America/Los_Angeles"),
  recheck: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    requireApiKey(request);

    // Parse and validate request body
    const body = await request.json();

    try {
      const validatedData = bookSchema.parse(body);
      return NextResponse.json({
        success: true,
        validated: validatedData,
        message: "Validation passed",
      });
    } catch (validationError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details:
            validationError instanceof z.ZodError
              ? validationError.errors
              : validationError,
          received: body,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Debug book endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}
