import { decryptToken } from "@/lib/utils/encryption";

export interface WhatsAppPublishRequest {
  accessToken: string;
  phoneNumberId: string;
  recipientNumber: string;
  content: string;
  imageUrl?: string;
}

export async function publishToWhatsApp({
  accessToken,
  phoneNumberId,
  recipientNumber,
  content,
  imageUrl,
}: WhatsAppPublishRequest) {
  try {
    const decryptedToken = decryptToken(accessToken);

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    // If there's an image, we send an image message with caption
    const body = imageUrl 
      ? {
          messaging_product: "whatsapp",
          to: recipientNumber,
          type: "image",
          image: {
            link: imageUrl,
            caption: content,
          },
        }
      : {
          messaging_product: "whatsapp",
          to: recipientNumber,
          type: "text",
          text: { body: content },
        };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${decryptedToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`WhatsApp Error: ${data.error.message}`);
    }

    return {
      success: true,
      postId: data.messages?.[0]?.id,
      url: "whatsapp://", // WhatsApp doesn't have public URLs for messages
    };
  } catch (error: any) {
    console.error("[WHATSAPP_PUBLISH_ERROR]", error);
    return { success: false, error: error.message };
  }
}
