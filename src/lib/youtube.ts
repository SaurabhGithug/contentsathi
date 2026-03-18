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

export interface VideoInfo {
  title: string;
  channel: string;
  videoId: string;
  url: string;
}

/** Search YouTube Data API v3 for top videos by view count */
export async function searchYouTube(
  query: string,
  apiKey: string,
  maxResults = 5
): Promise<VideoInfo[]> {
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    order: "viewCount",
    maxResults: String(maxResults),
    relevanceLanguage: "hi",
    key: apiKey,
  });

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`YouTube API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const items = data.items || [];

  return items.map((item: any) => ({
    videoId: item.id?.videoId || "",
    title: item.snippet?.title || "Untitled",
    channel: item.snippet?.channelTitle || "Unknown Channel",
    url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
  }));
}

/** Fetch video metadata (title + channel) for a single video ID */
export async function fetchVideoMeta(
  videoId: string,
  apiKey: string
): Promise<{ title: string; channel: string }> {
  try {
    const params = new URLSearchParams({
      part: "snippet",
      id: videoId,
      key: apiKey,
    });
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
    if (!res.ok) return { title: "YouTube Video", channel: "Unknown" };
    const data = await res.json();
    const snippet = data.items?.[0]?.snippet;
    return {
      title: snippet?.title || "YouTube Video",
      channel: snippet?.channelTitle || "Unknown",
    };
  } catch {
    return { title: "YouTube Video", channel: "Unknown" };
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
