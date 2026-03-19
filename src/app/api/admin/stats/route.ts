import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    newUsersToday,
    newUsersThisMonth,
    totalLeads,
    newLeadsToday,
    openLeads,
    totalRevenue,
    monthRevenue,
    activeTasks,
    failedPublishes,
    totalAssets,
    freeUsers,
    starterUsers,
    creatorUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.lead.count({ where: { status: { in: ["new", "contacted"] } } }),
    prisma.subscription.aggregate({ _sum: { amountPaid: true }, where: { status: "active" } }),
    prisma.subscription.aggregate({ _sum: { amountPaid: true }, where: { status: "active", createdAt: { gte: monthStart } } }),
    prisma.agentTask.count({ where: { status: "processing" } }),
    prisma.publishLog.count({ where: { status: "failed" } }),
    prisma.generatedAsset.count(),
    prisma.user.count({ where: { planTier: "free" } }),
    prisma.user.count({ where: { planTier: "starter" } }),
    prisma.user.count({ where: { planTier: "creator" } }),
  ]);

  return NextResponse.json({
    totalUsers,
    newUsersToday,
    newUsersThisMonth,
    totalLeads,
    newLeadsToday,
    openLeads,
    totalRevenue: totalRevenue._sum.amountPaid || 0,
    monthRevenue: monthRevenue._sum.amountPaid || 0,
    activeTasks,
    failedPublishes,
    totalAssets,
    planBreakdown: { free: freeUsers, starter: starterUsers, creator: creatorUsers },
  });
}
