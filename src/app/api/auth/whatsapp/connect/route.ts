import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/utils/auth";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/utils/rate-limiter";
import { sanitizeText } from "@/lib/utils/sanitize";
import { encryptToken } from "@/lib/utils/encryption";

// WhatsApp Business — Manual Token Save
// POST body: { phoneNumberId, accessToken, businessAccountId, testNumber? }

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit
  const limiter = rateLimit(`wa_connect:${session.user.email}`, RATE_LIMITS.auth);
  if (!limiter.success) return NextResponse.json(rateLimitResponse(limiter.retryAfter), { status: 429 });

  const body = await req.json();
  const { phoneNumberId, accessToken, businessAccountId, testNumber } = body;

  if (!phoneNumberId || !accessToken) {
    return NextResponse.json({ error: "Phone Number ID and Access Token are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Verify the token is valid by calling the WhatsApp API
  const verifyRes = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}?access_token=${accessToken}`
  );
  const verifyData = await verifyRes.json();

  if (verifyData.error) {
    return NextResponse.json({
      error: `Invalid WhatsApp token: ${verifyData.error.message}`,
    }, { status: 400 });
  }

  const displayName = verifyData.display_phone_number || phoneNumberId;

  const encryptedToken = encryptToken(accessToken);

  // Save to DB
  await (prisma.socialAccount as any).upsert({
    where: { userId_platform: { userId: user.id, platform: "whatsapp" } },
    create: {
      userId: user.id,
      platform: "whatsapp",
      accessToken: encryptedToken,
      accountId: phoneNumberId,
      accountName: displayName,
      metadata: JSON.stringify({ businessAccountId, testNumber }),
      isActive: true,
    },
    update: {
      accessToken: encryptedToken,
      accountId: phoneNumberId,
      accountName: displayName,
      metadata: JSON.stringify({ businessAccountId, testNumber }),
      isActive: true,
    },
  });

  // Optionally send test message
  if (testNumber) {
    try {
      await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: testNumber,
            type: "text",
            text: { body: "✅ Contentsathi WhatsApp connected successfully!" },
          }),
        }
      );
    } catch {
      // Test message failure is non-fatal
    }
  }

  return NextResponse.json({ success: true, displayName });
}
