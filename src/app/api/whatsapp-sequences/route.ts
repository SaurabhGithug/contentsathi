import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/whatsapp-sequences - List all sequences for user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const sequences = await prisma.whatsAppSequence.findMany({
      where: { userId: user.id },
      include: { steps: { orderBy: { stepNumber: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sequences);
  } catch (error) {
    console.error("[WHATSAPP_SEQUENCES_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/whatsapp-sequences - Create or update a sequence
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { name, description, steps } = body;

    if (!name || !steps || !Array.isArray(steps)) {
      return NextResponse.json({ error: "Name and steps are required" }, { status: 400 });
    }

    // Correct way to handle nested create/update in Prisma
    const sequence = await prisma.whatsAppSequence.create({
      data: {
        userId: user.id,
        name,
        description,
        steps: {
          create: steps.map((step: any, index: number) => ({
            stepNumber: index + 1,
            delayDays: step.delayDays || 0,
            messageBody: step.body || step.messageBody,
          })),
        },
      },
      include: { steps: true },
    });

    return NextResponse.json(sequence, { status: 201 });
  } catch (error) {
    console.error("[WHATSAPP_SEQUENCES_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
