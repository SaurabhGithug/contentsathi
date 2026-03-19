import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const leads = await prisma.lead.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        activities: {
          orderBy: { createdAt: "desc" },
          take: 5,
        }
      }
    });

    return NextResponse.json(leads);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, phone, email, source, status, notes, budget, location } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const lead = await prisma.lead.create({
      data: {
        userId: user.id,
        name,
        phone,
        email,
        source: source || "Manual",
        status: status || "NEW",
        notes,
        budget: budget ? parseFloat(budget) : null,
        location,
        activities: {
          create: {
            type: "CREATED",
            notes: `Lead created via ${source || "manual entry"}.`,
          }
        }
      }
    });

    return NextResponse.json(lead);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status, notes } = await request.json();

    const lead = await prisma.lead.update({
      where: { id },
      data: { 
        status, 
        notes,
        activities: {
          create: {
            type: "STATUS_CHANGE",
            notes: `Status updated to ${status}.`,
          }
        }
      }
    });

    return NextResponse.json(lead);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
