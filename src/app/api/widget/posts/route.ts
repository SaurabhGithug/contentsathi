import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get("apiKey");
    const userId = searchParams.get("userId");

    let resolvedUserId = userId;

    if (apiKey && !resolvedUserId) {
      const conn = await prisma.websiteConnection.findFirst({
        where: { apiKey, isActive: true },
        select: { userId: true }
      });
      if (conn) resolvedUserId = conn.userId;
    }

    if (!resolvedUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders() });
    }

    // Fetch latest 5 published calendar items for this user
    const postsRaw = await prisma.calendarItem.findMany({
      where: {
        userId: resolvedUserId,
        status: "published",
      },
      include: {
        generatedAsset: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 5,
    });

    const formatted = postsRaw.map((post) => ({
      id: post.id,
      title: post.generatedAsset?.title || "Latest Update",
      bodyPreview: (post.generatedAsset?.body || "").substring(0, 150) + "...",
      platform: post.platform,
      publishedAt: post.publishedAt,
      url: post.platformPostUrl,
      imageUrl: post.generatedAsset?.imageUrl || null,
    }));

    return NextResponse.json(formatted, {
      headers: {
        ...corsHeaders(),
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500, headers: corsHeaders() });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
