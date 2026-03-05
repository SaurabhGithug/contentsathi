// In-memory cache for OAuth 1.0a / 2.0 PKCE flow (for demo purposes)
// In production, this should be replaced with Redis or a database table
export const pendingVerifiers = new Map<string, string>();
