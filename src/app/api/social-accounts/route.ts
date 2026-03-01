import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const accounts = await prisma.socialAccount.findMany({
    where: { userId: user.id, isActive: true },
    select: {
      id: true,
      platform: true,
      accountName: true,
      accountId: true,
      pageId: true,
      tokenExpiry: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ accounts });
}

export async function DELETE(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const platform = searchParams.get("platform");
  
  if (!id && !platform) return NextResponse.json({ error: "ID or Platform required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (id) {
    await prisma.socialAccount.delete({
      where: { id, userId: user.id },
    });
  } else if (platform) {
    await prisma.socialAccount.deleteMany({
      where: { userId: user.id, platform: platform as any },
    });
  }

  return NextResponse.json({ success: true });
}
