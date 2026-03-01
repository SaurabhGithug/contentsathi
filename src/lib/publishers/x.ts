import { decryptToken } from "@/lib/encryption";

export interface XPublishRequest {
  accessToken: string;
  text: string;
  mediaIds?: string[]; // X requires uploading media first to get media_id
}

export async function publishToX({
  accessToken,
  text,
  mediaIds,
}: XPublishRequest) {
  try {
    const decryptedToken = decryptToken(accessToken);

    const body: any = { text };
    if (mediaIds && mediaIds.length > 0) {
      body.media = { media_ids: mediaIds };
    }

    const response = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${decryptedToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok || data.errors) {
      throw new Error(`X Error: ${data.detail || data.errors?.[0]?.message || response.statusText}`);
    }

    return {
      success: true,
      postId: data.data.id,
      url: `https://x.com/user/status/${data.data.id}`, // Note: actual username missing but status URL works
    };
  } catch (error: any) {
    console.error("[X_PUBLISH_ERROR]", error);
    return { success: false, error: error.message };
  }
}
