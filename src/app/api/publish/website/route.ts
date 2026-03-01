import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const {
    websiteId,
    postTitle,
    slug,
    body,
    category,
    tags,
    imageUrl,
    publishImmediately,
    calendarItemId,
  } = await req.json();

  if (!websiteId || !postTitle || !body) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const connection = await prisma.websiteConnection.findUnique({
    where: { id: websiteId },
  });

  if (!connection || connection.userId !== user.id) {
    return NextResponse.json({ error: "Website connection not found" }, { status: 404 });
  }

  try {
    const payload = {
      source: "contentsaarthi",
      apiKey: connection.apiKey,
      title: postTitle,
      slug: slug || postTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      body,
      category: category || "Uncategorized",
      tags: tags || [],
      featuredImage: imageUrl || "",
      publishImmediately: !!publishImmediately,
      timestamp: new Date().toISOString(),
    };

    const webhookRes = await fetch(connection.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!webhookRes.ok) {
      const errText = await webhookRes.text();
      throw new Error(`Website rejected the push: ${errText}`);
    }

    // Update the connection's last synced time
    await prisma.websiteConnection.update({
      where: { id: websiteId },
      data: { lastSyncedAt: new Date() },
    });

    if (calendarItemId) {
      await prisma.calendarItem.update({
        where: { id: calendarItemId },
        data: {
          status: "published",
          publishedAt: new Date(),
          platformPostUrl: `${connection.websiteUrl}/${payload.slug}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Successfully pushed content to website.",
      postUrl: `${connection.websiteUrl}/${payload.slug}`,
    });
  } catch (error: any) {
    if (calendarItemId) {
      await prisma.calendarItem.update({
        where: { id: calendarItemId },
        data: { status: "failed", failureReason: error.message },
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
