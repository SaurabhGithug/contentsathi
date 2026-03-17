import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch current integration settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const brain = await (prisma.contentBrain as any).findUnique({
      where: { userId: user.id },
      select: { zapierWebhookUrl: true, crmConfig: true },
    });

    return NextResponse.json({
      zapierWebhookUrl: brain?.zapierWebhookUrl || "",
      crmConfig: brain?.crmConfig || {},
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Save Zapier webhook and CRM config
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { zapierWebhookUrl, crmConfig } = await req.json();

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Validate webhook URL format if provided
    if (zapierWebhookUrl && !zapierWebhookUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Webhook URL must be a valid HTTPS URL." }, { status: 400 });
    }

    await (prisma.contentBrain as any).upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        brandName: user.name || "My Business",
        zapierWebhookUrl: zapierWebhookUrl || null,
        crmConfig: crmConfig || {},
      },
      update: {
        zapierWebhookUrl: zapierWebhookUrl || null,
        crmConfig: crmConfig || {},
      },
    });

    // Optionally ping Zapier to confirm webhook is live
    if (zapierWebhookUrl) {
      try {
        await fetch(zapierWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "webhook_test",
            source: "ContentSathi",
            message: "✅ Webhook verification: ContentSathi is now connected!",
            timestamp: new Date().toISOString(),
          }),
        });
      } catch {
        // Webhook ping failure is non-fatal
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
