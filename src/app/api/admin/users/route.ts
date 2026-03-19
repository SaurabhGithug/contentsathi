import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const role = user.adminRole || "super_admin";
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const plan = searchParams.get("plan") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }
  if (plan) where.planTier = plan;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        planTier: true,
        creditsBalance: true,
        creditsLifetimeUsed: true,
        isAdmin: true,
        adminRole: true,
        onboardingCompleted: true,
        createdAt: true,
        _count: { select: { agentTasks: true, generatedAssets: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const admin = session?.user as any;
  if (!admin?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, action, value } = await req.json();

  // Support admin can only view, not edit
  if (admin.adminRole === "support_admin") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  let update: any = {};
  if (action === "addCredits") {
    update = { creditsBalance: { increment: parseInt(value) } };
  } else if (action === "setCredits") {
    update = { creditsBalance: parseInt(value) };
  } else if (action === "setPlan") {
    // Only super_admin or sales_admin can change plans
    update = { planTier: value };
  } else if (action === "setAdminRole") {
    // Only super_admin can change admin roles
    if (admin.adminRole !== "super_admin" && admin.email !== process.env.SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "Only Super Admin can assign roles" }, { status: 403 });
    }
    update = { isAdmin: value !== "none", adminRole: value === "none" ? null : value };
  } else if (action === "deleteUser") {
    if (admin.adminRole !== "super_admin" && admin.email !== process.env.SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "Only Super Admin can delete users" }, { status: 403 });
    }
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  }

  const updated = await prisma.user.update({ where: { id: userId }, data: update });
  return NextResponse.json({ success: true, user: updated });
}
