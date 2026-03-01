import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { body, imageUrl, accessToken, providerAccountId } = await req.json();

    if (!accessToken) {
      return NextResponse.json({ error: "X (Twitter) account not connected." }, { status: 400 });
    }

    // Twitter v2 API for text, v1.1 for media upload
    // Requires both Access Token and Access Token Secret if using OAuth 1.0a
    // If using OAuth 2.0 (which NextAuth often does for Twitter), the v2 API endpoints apply,
    // but media upload is still complex with OAuth 2.0. 
    // We'll proceed with assumed OAuth 2.0 Bearer token for v2 text posting.
    
    // ── STEP 1: Thread Splitting ───────────────────────────────────────────
    const maxChars = 280;
    const tweets: string[] = [];
    
    // Simple split by double newline or sentences if too long
    if (body.length <= maxChars) {
      tweets.push(body);
    } else {
      let remaining = body;
      while (remaining.length > 0) {
        if (remaining.length <= maxChars) {
          tweets.push(remaining);
          break;
        }
        // Try to break at a newline first
        let breakIndex = remaining.lastIndexOf('\n', maxChars);
        // If no newline, break at a space
        if (breakIndex === -1) {
          breakIndex = remaining.lastIndexOf(' ', maxChars);
        }
        // If a single word is somehow > 280 chars (unlikely), force break
        if (breakIndex === -1) {
          breakIndex = maxChars;
        }
        
        const chunk = remaining.substring(0, breakIndex).trim();
        tweets.push(chunk);
        remaining = remaining.substring(breakIndex).trim();
      }
    }

    // ── STEP 2: Post to X ──────────────────────────────────────────────────
    // Because full twitter OAuth 1.0a signing is complex in a simple fetch,
    // and OAuth2 bearer tokens might not have write access without specific scopes,
    // we use a standard fetch assuming the accessToken is a valid v2 bearer with 'tweet.write' scope.

    let previousTweetId: string | null = null;
    let firstTweetId: string | null = null;
    
    for (let i = 0; i < tweets.length; i++) {
      const tweetBody: any = {
        text: tweets[i]
      };

      if (previousTweetId) {
        tweetBody.reply = { in_reply_to_tweet_id: previousTweetId };
      }

      // NOTE: Media upload via v1.1 requires OAuth 1.0a signatures usually, 
      // skipping image attach here for v2 bearer simplicity unless passed through a proxy.
      
      const tweetRes = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(tweetBody)
      });

      const tweetData = await tweetRes.json();
      
      if (!tweetRes.ok) {
        console.error("[X_PUBLISH_ERROR]", tweetData);
        // If it's a thread and the first one succeeded but later failed, we still return the first
        if (firstTweetId) break; 
        throw new Error(tweetData.detail || "Failed to publish to X/Twitter");
      }

      const id = tweetData.data.id;
      if (i === 0) firstTweetId = id;
      previousTweetId = id;
    }

    const platformPostUrl = `https://twitter.com/i/web/status/${firstTweetId}`;

    return NextResponse.json({
      success: true,
      platformPostId: firstTweetId,
      platformPostUrl,
      threadCount: tweets.length
    });

  } catch (error: any) {
    console.error(`[PUBLISH_X_ERROR]`, error);
    return NextResponse.json(
      { error: "X (Twitter) publishing failed: " + error.message },
      { status: 500 }
    );
  }
}
