import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ assets: [] });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ assets: [] });

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const tagsParam = searchParams.get("tags");
    const goldenOnly = searchParams.get("golden") === "true";

    const where: any = { userId: user.id };

    if (platform && platform !== "All") {
      where.platform = platform.toLowerCase();
    }

    if (type && type !== "All") {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
      ];
    }

    if (goldenOnly) {
      where.isGoldenExample = true;
    }

    if (tagsParam) {
      // Split by comma in case multiple tags are requested (e.g. "?tags=battle_card,marathi")
      const tagsArray = tagsParam.split(",").map(t => t.trim());
      where.tags = { hasSome: tagsArray };
    }

    const assets = await prisma.generatedAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        publishLogs: {
          select: { id: true, status: true, platformPostUrl: true },
        },
        calendarItems: {
          where: { status: "published" },
          select: { id: true, publishedAt: true, platform: true },
        },
      },
    });

    // Sync publishCount so Asset Vault reflects real published post counts
    const enriched = assets.map((asset: any) => {
      const fromLogs = asset.publishLogs?.filter((l: any) => l.status === "success").length ?? 0;
      const fromCalendar = asset.calendarItems?.length ?? 0;
      const finalCount = Math.max(fromLogs + fromCalendar, asset.publishCount ?? 0);
      return {
        ...asset,
        publishCount: finalCount,
        publishedUrls: asset.publishLogs
          ?.filter((l: any) => l.platformPostUrl)
          .map((l: any) => l.platformPostUrl) ?? [],
      };
    });

    return NextResponse.json({ assets: enriched });

  } catch (error: any) {
    console.error("Fetch assets error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// E10 — Bulk Delete
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    // Security: only delete assets belonging to this user
    const result = await prisma.generatedAsset.deleteMany({
      where: {
        id: { in: ids },
        userId: user.id,
      },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error: any) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
