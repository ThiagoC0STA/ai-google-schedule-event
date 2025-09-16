# 🚀 Setup Tutorial - Google Calendar API

This tutorial shows how to configure the environment variables needed for the scheduling API to work.

## 📋 Required Variables

```bash
GOOGLE_OAUTH_CLIENT_ID=your_client_id_here
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret_here
GOOGLE_OAUTH_REFRESH_TOKEN=your_refresh_token_here
API_SECRET_KEY=your_api_secret_key_here
TIMEZONE=America/Los_Angeles
```

## 🔧 Step by Step

### 1. **Enable Google Calendar API** ⚠️ **REQUIRED**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to **APIs & Services > Library**
4. Search for **"Google Calendar API"**
5. Click on **"Google Calendar API"**
6. Click **"ENABLE"**
7. ⚠️ **WAIT a few minutes** for the API to propagate

### 2. **Create OAuth2 Credentials**

1. In Google Cloud Console, go to **APIs & Services > Credentials**
2. Click **"+ CREATE CREDENTIALS"**
3. Select **"OAuth client ID"**
4. If it's the first time, configure the **OAuth consent screen**:
   - Choose **"External"** (for personal accounts) or **"Internal"** (for Workspace)
   - Fill in the required fields
   - Add your email as a test user
5. Go back to **Credentials** and create the **OAuth client ID**:
   - **Application type:** Desktop application
   - **Name:** Your project name
6. **Copy and save:**
   - `GOOGLE_OAUTH_CLIENT_ID`
   - `GOOGLE_OAUTH_CLIENT_SECRET`

### 3. **Configure Redirect URI**

1. Click on the created **OAuth client ID**
2. In **"Authorized redirect URIs"**, add:
   ```
   http://localhost:3001/auth/callback
   ```
3. Click **"SAVE"**

### 4. **Generate Refresh Token**

#### Option A: Using the project script
```bash
# Set the variables
export GOOGLE_OAUTH_CLIENT_ID="your_client_id"
export GOOGLE_OAUTH_CLIENT_SECRET="your_client_secret"

# Run the script
node generate-refresh-token.js
```

#### Option B: Manual (OAuth 2.0 Playground)
1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click **"Settings"** (gear icon)
3. Check **"Use your own OAuth credentials"**
4. Paste your **Client ID** and **Client Secret**
5. On the left side, find **"Google Calendar API v3"**
6. Select **"https://www.googleapis.com/auth/calendar"**
7. Click **"Authorize APIs"**
8. Login with the desired account (`thiago@leych.com`)
9. Click **"Exchange authorization code for tokens"**
10. **Copy the `refresh_token`** (not the access_token)

### 5. **Generate API Secret Key**

```bash
# In terminal (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use any secure password generator
```

### 6. **Configure Timezone**

For **California (PST/PDT):**
```bash
TIMEZONE=America/Los_Angeles
```

For **New York (EST/EDT):**
```bash
TIMEZONE=America/New_York
```

For **Brazil:**
```bash
TIMEZONE=America/Sao_Paulo
```

## 🔄 Final Configuration

### `.env` file (local)
```bash
GOOGLE_OAUTH_CLIENT_ID=your_client_id_here
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret_here
GOOGLE_OAUTH_REFRESH_TOKEN=your_refresh_token_here
API_SECRET_KEY=your_api_secret_key_here
TIMEZONE=America/Los_Angeles
```

### Vercel (deploy)
1. Go to **Project Settings > Environment Variables**
2. Add all the variables above
3. **Redeploy**

## ✅ Test

```bash
curl -X POST "https://your-api.vercel.app/api/suggest" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_secret_key" \
  -d '{
    "requestedStartISO": "2025-01-11T14:00:00.000-08:00",
    "workHours": [9, 18],
    "bufferMin": 10,
    "calendarId": "primary",
    "tz": "America/Los_Angeles"
  }'
```

## 🚨 Common Issues

### Error 401 (Unauthorized)
- Check if `API_SECRET_KEY` is correct
- Check if the `X-API-Key` header is being sent

### Error 500 (Internal Server Error)
- ⚠️ **Google Calendar API is not enabled** (most common)
- Check if `GOOGLE_OAUTH_REFRESH_TOKEN` is correct
- Check if the account has calendar permissions

### Error 403 (Forbidden)
- Check if OAuth consent screen is configured
- Check if the account is added as a test user

### Weird times
- Check if `TIMEZONE` is correct for the company's region
- Check if `requestedStartISO` is in the correct timezone

## 📞 Support

If you have issues, check:
1. ✅ Google Calendar API is enabled
2. ✅ OAuth consent screen configured
3. ✅ Redirect URI added
4. ✅ Valid refresh token
5. ✅ Correct timezone
6. ✅ API Secret Key configured

---

**🎯 Remember: Google Calendar API MUST be enabled to work!**
