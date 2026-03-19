import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const count = await prisma.waitlist.count();
    // Add a base offset if they want but 
    // actually, let's just return actual count.
    return NextResponse.json({ count });
  } catch (error) {
    console.error("[WAITLIST_COUNT_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch count" }, { status: 500 });
  }
}
