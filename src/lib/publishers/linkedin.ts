import { decryptToken } from "@/lib/encryption";

export interface LinkedInPublishRequest {
  accessToken: string;
  authorId: string; // urn:li:person:ID or urn:li:organization:ID
  text: string;
  imageUrl?: string;
  title?: string;
}

export async function publishToLinkedIn({
  accessToken,
  authorId,
  text,
  imageUrl,
  title,
}: LinkedInPublishRequest) {
  try {
    const decryptedToken = decryptToken(accessToken);

    // If there's an image, we'd need a multi-step upload (Register -> Upload -> Create)
    // For MVP text-only or simple link, we use the simpler UGC Post API
    // LinkedIn API v2 is restrictive; standardizing on 'share' or 'ugcPost'
    
    if (imageUrl) {
        // Full media implementation requires binary upload to an uploadUrl
        // For Saarthi MVP, we'll implement text-first and handle media registration next.
        // Returning a placeholder for image-based posts if not fully ready.
    }

    const body = {
      author: authorId.startsWith("urn:li:") ? authorId : `urn:li:person:${authorId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: text,
          },
          shareMediaCategory: imageUrl ? "IMAGE" : "NONE",
          media: imageUrl ? [
            {
              status: "READY",
              description: {
                commentary: `${text}\n\n---\nPublished via Contentsathi AI`,
              },
              media: imageUrl, // Note: LinkedIn needs an asset URN, not just a URL. 
              title: {
                text: title || "Social Post",
              },
            }
          ] : [],
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${decryptedToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.message || !response.ok) {
        throw new Error(`LinkedIn Error: ${data.message || response.statusText}`);
    }

    return {
      success: true,
      postId: data.id,
      url: `https://www.linkedin.com/feed/update/${data.id}`,
    };
  } catch (error: any) {
    console.error("[LINKEDIN_PUBLISH_ERROR]", error);
    return { success: false, error: error.message };
  }
}
