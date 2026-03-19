import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const items = await prisma.calendarItem.findMany({
      where: {
        userId: user.id,
        scheduledAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { scheduledAt: "asc" },
      include: { 
        generatedAsset: true,
        publishLogs: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("[CALENDAR_TODAY_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
