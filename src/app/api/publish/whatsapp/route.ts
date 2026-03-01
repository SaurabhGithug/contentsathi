import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  let calendarItemId: string | undefined;
  try {
    const bodyText = await req.json();
    const { body, imageUrl, accessToken, providerAccountId, broadcastList } = bodyText;
    calendarItemId = bodyText.calendarItemId;

    if (!providerAccountId || !accessToken) {
      return NextResponse.json({ error: "WhatsApp account not connected." }, { status: 400 });
    }

    // Parse the broadcastList
    let phones: string[] = [];
    if (broadcastList) {
      try {
        phones = typeof broadcastList === 'string' ? JSON.parse(broadcastList) : broadcastList;
        if (!Array.isArray(phones)) phones = [];
      } catch {
        phones = [];
      }
    }

    if (phones.length === 0) {
      return NextResponse.json({ error: "No numbers found in your WhatsApp Broadcast List." }, { status: 400 });
    }

    const apiUrl = `https://graph.facebook.com/v19.0/${providerAccountId}/messages`;
    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Helper for rate-limiting (WhatsApp API prefers ~80 msgs/sec, but we go 1/sec for safety on a basic tier)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const phone of phones) {
      // Clean phone number (remove +, spaces, hyphens)
      const cleanPhone = phone.replace(/\D/g, '');

      let messagePayload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: { 
          preview_url: true,
          body: body 
        }
      };

      if (imageUrl) {
        messagePayload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "image",
          image: {
            link: imageUrl,
            caption: body
          }
        };
      }

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(messagePayload)
        });

        const data = await res.json();
        
        if (!res.ok) {
          console.error(`[WA_SEND_ERROR] to ${cleanPhone}:`, data);
          errors.push(`Failed sending to ${cleanPhone}: ${data.error?.message || "Unknown error"}`);
          failedCount++;
        } else {
          sentCount++;
        }
      } catch (err: any) {
        errors.push(`Network error sending to ${cleanPhone}: ${err.message}`);
        failedCount++;
      }

      // Respect basic rate limits (1 second pause)
      await delay(1000);
    }

    if (sentCount === 0) {
      throw new Error("Failed to send WhatsApp broadcast. Check details: " + errors.join("; "));
    }

    const platformPostUrl = "https://business.facebook.com/wa/manage/messageapi/";
    const platformPostId = `wb_broadcast_${Date.now()}`;

    if (calendarItemId) {
      await prisma.calendarItem.update({
        where: { id: calendarItemId },
        data: {
          status: "published",
          platformPostId,
          platformPostUrl,
          publishedAt: new Date(),
        }
      });
    }

    return NextResponse.json({
      success: true,
      platformPostId,
      platformPostUrl,
      stats: {
        sent: sentCount,
        failed: failedCount,
        total: phones.length
      }
    });

  } catch (error: any) {
    console.error(`[PUBLISH_WHATSAPP_ERROR]`, error);
    if (calendarItemId) {
      try {
        await prisma.calendarItem.update({
          where: { id: calendarItemId },
          data: { status: "failed", failureReason: error.message },
        });
      } catch (e) { console.error("Failed to update WA status", e); }
    }
    return NextResponse.json(
      { error: "WhatsApp broadcasting failed: " + error.message },
      { status: 500 }
    );
  }
}
