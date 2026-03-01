import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // Public API route, no auth session checking.
    // Fetch latest 5 published calendar items for this user
    const postsRaw = await prisma.calendarItem.findMany({
      where: {
        userId,
        status: "published",
        // Only return blog/article format content for embed widget
      },
      include: {
        generatedAsset: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 5,
    });

    // Format response explicitly so we don't leak anything extra
    const formatted = postsRaw.map((post) => ({
      id: post.id,
      title: post.generatedAsset?.title || "Untitled",
      bodyPreview: (post.generatedAsset?.body || "").substring(0, 150) + "...",
      platform: post.platform,
      publishedAt: post.publishedAt,
      url: post.platformPostUrl,
      imageUrl: post.generatedAsset?.imageUrl || null,
    }));

    // Return with CORS headers
    return NextResponse.json(formatted, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load public posts" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
