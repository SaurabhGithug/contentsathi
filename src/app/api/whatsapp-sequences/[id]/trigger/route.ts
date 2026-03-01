import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/whatsapp-sequences/[id]/trigger - Assign sequence to contacts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { contactNumbers, broadcastName } = body as {
      contactNumbers: string[];
      broadcastName?: string;
    };

    if (!contactNumbers || contactNumbers.length === 0) {
      return NextResponse.json({ error: "At least one contact number is required" }, { status: 400 });
    }

    // Fetch the sequence with steps — stepNumber and delayDays per schema
    const sequence = await prisma.whatsAppSequence.findFirst({
      where: { id: params.id, userId: user.id },
      include: { steps: { orderBy: { stepNumber: "asc" } } },
    });

    if (!sequence) {
      return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
    }

    // Get connected WhatsApp account
    const waAccount = await prisma.socialAccount.findFirst({
      where: { userId: user.id, platform: "whatsapp" },
    });

    if (!waAccount) {
      return NextResponse.json(
        { error: "No WhatsApp Business account connected. Go to Settings → Connected Accounts." },
        { status: 400 }
      );
    }

    // For each contact × step, create a scheduled calendar item
    const triggerResults: { calendarItemId: string; phone: string; day: number }[] = [];
    for (const phone of contactNumbers) {
      for (const step of sequence.steps) {
        const scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + (step.delayDays || 0));
        scheduledAt.setHours(10, 0, 0, 0);

        const calItem = await prisma.calendarItem.create({
          data: {
            userId: user.id,
            platform: "whatsapp",
            scheduledAt,
            notes: `[Sequence: ${sequence.name}] Step ${step.stepNumber} | To: ${phone}${broadcastName ? ` | List: ${broadcastName}` : ""}`,
            status: "scheduled",
          },
        });
        triggerResults.push({ calendarItemId: calItem.id, phone, day: step.delayDays });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sequence "${sequence.name}" triggered for ${contactNumbers.length} contact(s) — ${triggerResults.length} messages scheduled.`,
      triggered: triggerResults.length,
    });
  } catch (error: any) {
    console.error("[SEQUENCE_TRIGGER]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
