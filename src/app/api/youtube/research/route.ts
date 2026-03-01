import { NextResponse } from "next/server";
import { extractVideoId, fetchTranscript, trimTranscript } from "@/lib/youtube";

interface VideoInfo {
  title: string;
  channel: string;
  videoId: string;
  url: string;
}

/** Search YouTube Data API v3 for top videos by view count */
async function searchYouTube(
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
async function fetchVideoMeta(
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

// ─── Route Handler ─────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, city, youtubeLink } = body as {
      topic?: string;
      city?: string;
      youtubeLink?: string;
    };

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "YOUTUBE_API_KEY is not configured. Please add it to your .env file." },
        { status: 500 }
      );
    }

    // ── Mode 1: Specific YouTube link provided ──────────────────────────
    if (youtubeLink && youtubeLink.trim()) {
      const videoId = extractVideoId(youtubeLink.trim());
      if (!videoId) {
        return NextResponse.json(
          { error: "Invalid YouTube URL. Please paste a valid youtube.com or youtu.be link." },
          { status: 400 }
        );
      }

      const [meta, transcript] = await Promise.all([
        fetchVideoMeta(videoId, apiKey),
        fetchTranscript(videoId),
      ]);

      const video: VideoInfo = {
        videoId,
        title: meta.title,
        channel: meta.channel,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };

      if (!transcript) {
        return NextResponse.json({
          videos: [video],
          mergedTranscript: "",
          warning: "This video does not have a public transcript available.",
        });
      }

      return NextResponse.json({
        videos: [video],
        mergedTranscript: trimTranscript(transcript),
      });
    }

    // ── Mode 2: Topic-based YouTube search ─────────────────────────────
    if (!topic?.trim()) {
      return NextResponse.json(
        { error: "Either a topic or a YouTube link is required." },
        { status: 400 }
      );
    }

    const query = [topic.trim(), city?.trim()].filter(Boolean).join(" ");
    const videos = await searchYouTube(query, apiKey, 5);

    if (videos.length === 0) {
      return NextResponse.json({
        videos: [],
        mergedTranscript: "",
        warning: "No YouTube videos found for this topic.",
      });
    }

    // Fetch all transcripts in parallel
    const transcriptResults = await Promise.all(
      videos.map((v) => fetchTranscript(v.videoId))
    );

    // Build merged transcript with video separators
    const sections: string[] = [];
    for (let i = 0; i < videos.length; i++) {
      const text = transcriptResults[i];
      if (text) {
        sections.push(
          `--- Video ${i + 1}: "${videos[i].title}" by ${videos[i].channel} ---\n${text}`
        );
      }
    }

    const mergedTranscript = trimTranscript(sections.join("\n\n"));

    return NextResponse.json({ videos, mergedTranscript });
  } catch (error: any) {
    console.error("[YOUTUBE_RESEARCH_ERROR]", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "YouTube research failed." },
      { status: 500 }
    );
  }
}
