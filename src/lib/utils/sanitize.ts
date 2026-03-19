export function sanitizeText(text: string, maxLength: number = 5000): string {
  if (!text) return "";

  // 1. Strip HTML tags
  let sanitized = text.replace(/<[^>]*>?/gm, "");

  // 2. basic prompt injection defense
  const promptInjectionPatterns = [
    /ignore previous/i,
    /you are now/i,
    /system prompt/i,
    /forget all/i
  ];

  for (const pattern of promptInjectionPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error("Invalid input containing restricted keywords.");
    }
  }

  // 3. Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized.trim();
}
