
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const waitlist = await prisma.waitlist.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ waitlist });
  } catch (error) {
    console.error("[WAITLIST_VIEW_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch waitlist" }, { status: 500 });
  }
}
