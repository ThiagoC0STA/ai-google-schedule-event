/**
 * @license MIT
 * API key authentication middleware
 */

/**
 * Validates the x-api-key header from the request
 * @param request - The incoming request object
 * @throws Error if API key is missing or invalid
 */
export function requireApiKey(request: Request): void {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.API_SECRET_KEY;

  if (!expectedKey) {
    throw new Error("API_SECRET_KEY not configured");
  }

  if (!apiKey || apiKey !== expectedKey) {
    throw new Error("Invalid or missing API key");
  }
}
