import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const connections = await prisma.websiteConnection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(connections);
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { name, siteUrl, webhookUrl } = await req.json();

  if (!name || !siteUrl || !webhookUrl) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  // Generate a random UUID API Key
  const apiKey = crypto.randomUUID();

  const connection = await prisma.websiteConnection.create({
    data: {
      userId: user.id,
      websiteName: name,
      websiteUrl: siteUrl,
      webhookUrl,
      apiKey,
      isActive: true,
    },
  });

  return NextResponse.json({ success: true, connection });
}
