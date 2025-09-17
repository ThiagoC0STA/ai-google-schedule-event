/**
 * @license MIT
 * Webhook endpoint - receives data from Zapier and initiates Bland AI conversation
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema to validate Zapier data
const webhookSchema = z.object({
  phone_number: z.string(),
  lead_name: z.string(),
  lead_email: z.string(),
  preferred_datetime_raw: z.string().optional(),
  lead_phone: z.string().optional(),
  lead_message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = webhookSchema.parse(body);

    console.log("Webhook received data:", validatedData);

    // Initiate conversation with Bland AI
    const blandAIResponse = await initiateBlandAIConversation(validatedData);

    return NextResponse.json({
      success: true,
      message: "Conversation initiated with Bland AI",
      data: validatedData,
      blandAI: blandAIResponse,
    });
  } catch (error) {
    console.error("Webhook error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function initiateBlandAIConversation(data: any) {
  try {
    // Bland AI API URL to start conversation
    const blandAIUrl = "https://api.bland.ai/v1/calls";

    // Headers with Bland AI API key
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.BLANDAPIKEY}`,
    };

    // Data to send to Bland AI
    const blandAIData = {
      phone_number: data.phone_number,
      task: "Schedule consultation with Facebook lead",
      voice: "mason",
      request_data: {
        lead_name: data.lead_name,
        lead_email: data.lead_email,
        preferred_datetime_raw: data.preferred_datetime_raw || "",
        lead_phone: data.lead_phone || data.phone_number,
        lead_message:
          data.lead_message || "Lead interested in scheduling consultation",
      },
      answering_machine_detection: false,
    };

    // Make request to Bland AI
    const response = await fetch(blandAIUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(blandAIData),
    });

    if (!response.ok) {
      throw new Error(`Bland AI API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("Bland AI response:", result);

    return result;
  } catch (error) {
    console.error("Error initiating Bland AI conversation:", error);
    throw error;
  }
}
