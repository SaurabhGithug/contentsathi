import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const connection = await prisma.websiteConnection.findUnique({
    where: { id: params.id },
  });

  if (!connection || connection.userId !== user.id) {
    return NextResponse.json({ error: "Connection not found or access denied" }, { status: 404 });
  }

  await prisma.websiteConnection.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
