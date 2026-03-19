import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const contactSource = searchParams.get("contactSource") || "";
  const assignedTo = searchParams.get("assignedTo") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 25;

  const where: any = {};
  if (status) where.status = status;
  if (contactSource) where.contactSource = contactSource;
  if (assignedTo) where.assignedTo = assignedTo;

  // Sales admin only sees sales + pricing + partnership leads
  const adminRole = user.adminRole;
  if (adminRole === "sales_admin") {
    where.contactSource = { in: ["sales_pricing", "partnership", "billing"] };
  } else if (adminRole === "technical_admin") {
    where.contactSource = { in: ["technical", "api_access"] };
  } else if (adminRole === "support_admin") {
    where.contactSource = { in: ["general", undefined] };
  }
  // super_admin sees all

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  return NextResponse.json({ leads, total, page, pages: Math.ceil(total / limit) });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const admin = session?.user as any;
  if (!admin?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { leadId, status, notes, assignedTo } = await req.json();

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: {
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
      ...(assignedTo !== undefined && { assignedTo }),
      lastContactAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, lead: updated });
}
