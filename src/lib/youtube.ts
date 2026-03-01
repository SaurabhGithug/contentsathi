import { YoutubeTranscript } from "youtube-transcript";

/** Extract a YouTube video ID from a URL or return the string as-is if it's already an ID */
export function extractVideoId(urlOrId: string): string | null {
  try {
    const url = new URL(urlOrId);
    // youtu.be/ID
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("?")[0];
    // youtube.com/watch?v=ID
    const v = url.searchParams.get("v");
    if (v) return v;
    // youtube.com/shorts/ID  or  youtube.com/embed/ID
    const pathParts = url.pathname.split("/").filter(Boolean);
    if (pathParts.length >= 2 && ["shorts", "embed", "v"].includes(pathParts[0])) {
      return pathParts[1];
    }
    return null;
  } catch {
    // Not a URL — check if it looks like a raw video ID (11 alphanum chars)
    if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId.trim())) return urlOrId.trim();
    return null;
  }
}

/** Fetch transcript for a single video ID. Returns empty string on failure. */
export async function fetchTranscript(videoId: string): Promise<string> {
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId, { lang: "hi" }).catch(() =>
      YoutubeTranscript.fetchTranscript(videoId, { lang: "en" })
    );
    return items.map((item) => item.text).join(" ");
  } catch {
    return "";
  }
}

export function trimTranscript(text: string, maxChars = 32000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n\n[...transcript trimmed for length]";
}
