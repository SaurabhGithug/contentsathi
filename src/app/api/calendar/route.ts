import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/utils/auth";

// GET /api/calendar  - List items for the authenticated user
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const items = await prisma.calendarItem.findMany({
      where: {
        userId: user.id,
        ...(from && to ? {
          scheduledAt: {
            gte: new Date(from),
            lte: new Date(to),
          },
        } : {}),
      },
      orderBy: { scheduledAt: "asc" },
      include: { generatedAsset: true },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("[CALENDAR_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/calendar - Create a new calendar item
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { generatedAssetId, platform, scheduledAt, notes, isSuggested, festivalTag } = body;

    if (!scheduledAt || !platform) {
      return NextResponse.json({ error: "platform and scheduledAt are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const item = await prisma.calendarItem.create({
      data: {
        userId: user.id,
        generatedAssetId: generatedAssetId || null,
        platform,
        scheduledAt: new Date(scheduledAt),
        notes: notes || null,
        isSuggested: isSuggested || false,
        festivalTag: festivalTag || null,
        status: "scheduled",
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("[CALENDAR_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
