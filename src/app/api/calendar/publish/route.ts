import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/utils/auth";
import { dispatchPublication } from "@/lib/publishers/publish-dispatcher";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { itemId } = await req.json();

    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Verify ownership of the calendar item
    const item = await prisma.calendarItem.findFirst({
      where: { id: itemId, userId: user.id }
    });

    if (!item) {
      return NextResponse.json({ error: "Calendar item not found or access denied" }, { status: 404 });
    }

    await prisma.calendarItem.update({
      where: { id: itemId },
      data: { status: "publishing", failureReason: null }
    });

    const result = await dispatchPublication(itemId);

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

  } catch (error: any) {
    console.error("[CALENDAR_PUBLISH_ROUTE_ERROR]", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
