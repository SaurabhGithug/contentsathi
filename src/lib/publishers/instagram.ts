import { decryptToken } from "@/lib/encryption";

export interface InstagramPublishRequest {
  accessToken: string;
  instagramBusinessAccountId: string;
  imageUrl?: string;
  caption: string;
}

export async function publishToInstagram({
  accessToken,
  instagramBusinessAccountId,
  imageUrl,
  caption,
}: InstagramPublishRequest) {
  try {
    const decryptedToken = decryptToken(accessToken);

    // 1. Create Media Container
    const containerRes = await fetch(
      `https://graph.facebook.com/v18.0/${instagramBusinessAccountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption,
          access_token: decryptedToken,
        }),
      }
    );
    const containerData = await containerRes.json();

    if (containerData.error) {
      throw new Error(`IG Container Error: ${containerData.error.message}`);
    }

    const creationId = containerData.id;

    // 2. Wait for container to be ready (usually fast for images, but good practice)
    // For MVP, we'll try to publish immediately or after a short delay
    // In prod, you'd poll /${creationId}?fields=status_code
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 3. Publish Media
    const publishRes = await fetch(
      `https://graph.facebook.com/v18.0/${instagramBusinessAccountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: decryptedToken,
        }),
      }
    );
    const publishData = await publishRes.json();

    if (publishData.error) {
      throw new Error(`IG Publish Error: ${publishData.error.message}`);
    }

    return { 
        success: true, 
        postId: publishData.id,
        url: `https://www.instagram.com/p/${publishData.id}/` // Note: FB ID != IG Shortcode, but this is a placeholder
    };
  } catch (error: any) {
    console.error("[INSTAGRAM_PUBLISH_ERROR]", error);
    return { success: false, error: error.message };
  }
}
