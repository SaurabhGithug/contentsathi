import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { notifyOnPublish, notifyOnFailure, notifyWeeklyDigest, notifyWhatsappNumber, platformLangPrefs } = body;

    const updatedUser = await (prisma.user as any).update({
      where: { id: user.id },
      data: {
        notifyOnPublish: notifyOnPublish ?? (user as any).notifyOnPublish,
        notifyOnFailure: notifyOnFailure ?? (user as any).notifyOnFailure,
        notifyWeeklyDigest: notifyWeeklyDigest ?? (user as any).notifyWeeklyDigest,
        notifyWhatsappNumber: notifyWhatsappNumber ?? (user as any).notifyWhatsappNumber,
        platformLangPrefs: platformLangPrefs !== undefined 
          ? { ...(((user as any).platformLangPrefs as object) || {}), ...platformLangPrefs } 
          : (user as any).platformLangPrefs,
      }
    });

    return NextResponse.json({ success: true, preferences: updatedUser });
  } catch (error) {
    console.error("[PREFERENCES_UPDATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
