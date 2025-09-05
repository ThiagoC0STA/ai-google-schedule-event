# AI Google Calendar Scheduler

A production-ready Next.js API for integrating with Google Calendar and Google Meet. Designed for AI assistants like Bland to check availability and book meetings with automatic Meet link generation.

## Features

- ✅ Check calendar availability with customizable work hours
- ✅ Book events with automatic Google Meet link generation
- ✅ Cancel existing events
- ✅ Support for multiple timezones
- ✅ Service Account and OAuth2 authentication
- ✅ Secure API key authentication
- ✅ Production-ready error handling and validation

## Tech Stack

- **Next.js 14+** (App Router)
- **TypeScript** for type safety
- **Google Calendar API** via googleapis
- **Zod** for request validation
- **Luxon** for timezone handling
- **ESLint + Prettier** for code quality

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `env.example` to `.env.local` and configure your credentials:

```bash
cp env.example .env.local
```

#### Option A: Service Account (Recommended for Production)

For Google Workspace accounts, use Service Account with Domain-Wide Delegation:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API
4. Create a Service Account:
   - Go to IAM & Admin > Service Accounts
   - Create Service Account
   - Download the JSON key file
5. Set up Domain-Wide Delegation:
   - In Service Account details, enable Domain-Wide Delegation
   - Note the Client ID
   - In Google Admin Console, add the Client ID with Calendar scope
6. Configure environment variables:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
GOOGLE_IMPERSONATE_EMAIL=calendar-owner@yourdomain.com
```

#### Option B: OAuth2 (Fallback)

For personal Google accounts or when Service Account is not available:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth2 credentials
3. Get refresh token using OAuth2 flow
4. Configure environment variables:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
```

### 3. API Security

Set a secure API key:

```env
INTERNAL_API_KEY=your-secure-random-key-here
```

### 4. Timezone Configuration

Set your default timezone:

```env
TZ=America/Sao_Paulo
```

## API Endpoints

All endpoints require the `x-api-key` header with your `INTERNAL_API_KEY`.

### 1. Check Availability

**POST** `/api/availability`

Returns the next 3 available time slots.

**Request Body:**
```json
{
  "days": 7,                    // Search horizon (1-30 days)
  "durationMin": 45,            // Slot duration (15-480 minutes)
  "workHours": [9, 18],         // Work hours [start, end]
  "bufferMin": 10,              // Buffer before/after (0-60 minutes)
  "calendarId": "primary",      // Calendar ID
  "tz": "America/New_York"      // Timezone (optional)
}
```

**Response:**
```json
{
  "timeZone": "America/New_York",
  "slots": [
    {
      "start": "2025-01-15T10:00:00-05:00",
      "end": "2025-01-15T10:45:00-05:00"
    },
    {
      "start": "2025-01-15T14:00:00-05:00",
      "end": "2025-01-15T14:45:00-05:00"
    },
    {
      "start": "2025-01-16T09:00:00-05:00",
      "end": "2025-01-16T09:45:00-05:00"
    }
  ]
}
```

### 2. Book Event

**POST** `/api/book`

Creates a calendar event with Google Meet link.

**Request Body:**
```json
{
  "startISO": "2025-01-15T10:00:00-05:00",
  "endISO": "2025-01-15T10:45:00-05:00",
  "attendeeEmail": "client@example.com",  // Optional
  "title": "Call Bland AI",
  "description": "Meeting description",   // Optional
  "calendarId": "primary",
  "tz": "America/New_York",
  "recheck": true                         // Revalidate availability
}
```

**Response:**
```json
{
  "eventId": "abc123def456",
  "meetLink": "https://meet.google.com/abc-defg-hij",
  "htmlLink": "https://calendar.google.com/event?eid=..."
}
```

### 3. Cancel Event

**POST** `/api/cancel`

Deletes a calendar event.

**Request Body:**
```json
{
  "eventId": "abc123def456",
  "calendarId": "primary"
}
```

**Response:**
```json
{
  "ok": true
}
```

## Testing with cURL

### Check Availability
```bash
curl -X POST https://your-domain.com/api/availability \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "days": 7,
    "durationMin": 45,
    "workHours": [9, 18],
    "bufferMin": 10,
    "tz": "America/New_York"
  }'
```

### Book Event
```bash
curl -X POST https://your-domain.com/api/book \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "startISO": "2025-01-15T10:00:00-05:00",
    "endISO": "2025-01-15T10:45:00-05:00",
    "attendeeEmail": "client@example.com",
    "title": "Intro Call",
    "tz": "America/New_York"
  }'
```

### Cancel Event
```bash
curl -X POST https://your-domain.com/api/cancel \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "eventId": "abc123def456"
  }'
```

## Deployment to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically

3. **Environment Variables in Vercel:**
   - Go to Project Settings > Environment Variables
   - Add all variables from your `.env.local`

## Integration with Bland AI

### Tool Configuration

Configure these tools in your Bland AI assistant:

#### 1. getAvailability Tool
```json
{
  "name": "getAvailability",
  "description": "Get available time slots for scheduling",
  "parameters": {
    "days": {"type": "number", "default": 7},
    "durationMin": {"type": "number", "default": 45},
    "workHours": {"type": "array", "default": [9, 18]},
    "bufferMin": {"type": "number", "default": 10},
    "tz": {"type": "string", "default": "America/New_York"}
  }
}
```

#### 2. bookSlot Tool
```json
{
  "name": "bookSlot",
  "description": "Book a calendar event with Google Meet",
  "parameters": {
    "startISO": {"type": "string", "required": true},
    "endISO": {"type": "string", "required": true},
    "attendeeEmail": {"type": "string"},
    "title": {"type": "string", "default": "Call Bland AI"},
    "tz": {"type": "string", "default": "America/New_York"}
  }
}
```

### Suggested AI Prompt

```
When users request scheduling:

1. First, call getAvailability to get the next 3 available slots
2. Present the options to the user with clear timezone information
3. When user selects a slot, call bookSlot with the chosen time
4. Confirm the booking and provide the Google Meet link
5. Always inform the user about the timezone being used

If a requested time is not available, offer the available alternatives from getAvailability.
```

## Error Handling

The API returns appropriate HTTP status codes:

- **200**: Success
- **400**: Bad Request (invalid input)
- **401**: Unauthorized (invalid API key)
- **404**: Not Found (event not found)
- **409**: Conflict (time slot no longer available)
- **500**: Internal Server Error

## Security Notes

- All endpoints require valid `x-api-key` header
- Google credentials are validated on each request
- Input validation using Zod schemas
- No sensitive data in error responses
- Timezone validation prevents timezone attacks

## License

MIT License - see individual file headers for details.

## Support

For issues or questions, please check the error logs and ensure all environment variables are properly configured.# ai-google-schedule-event
