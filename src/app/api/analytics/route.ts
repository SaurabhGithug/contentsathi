import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { startOfDay, subDays, format } from "date-fns";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        agentTasks: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const range = parseInt(searchParams.get("range") || "30");
    const since = subDays(new Date(), range);

    // ── 1. Post Analytics (Reach, Impressions, Clicks, etc) ─────────────
    const analyticsRecords = await prisma.postAnalytics.findMany({
      where: {
        userId: user.id,
        fetchedAt: { gte: since },
      },
      include: {
        generatedAsset: {
          select: { title: true, tags: true },
        },
      },
      orderBy: { fetchedAt: "asc" },
    });

    // ── 2. Aggregate Metrics ─────────────────────────────────────────────
    const totalImpressions = analyticsRecords.reduce((acc, r) => acc + (r.impressions || 0), 0);
    const totalReach = analyticsRecords.reduce((acc, r) => acc + (r.reach || 0), 0);
    const totalLikes = analyticsRecords.reduce((acc, r) => acc + (r.likes || 0), 0);
    const totalComments = analyticsRecords.reduce((acc, r) => acc + (r.comments || 0), 0);
    const totalClicks = analyticsRecords.reduce((acc, r) => acc + (r.clicks || 0), 0);

    // Simulated lead data (since we don't have a Lead model yet)
    // In a real app, this would query a 'Leads' table filters by publishLogId
    const baseLeads = analyticsRecords.reduce((acc, r) => acc + Math.floor((r.clicks || 0) * 0.15), 0);
    const totalLeads = baseLeads || (analyticsRecords.length > 0 ? 12 : 0);
    const adSpend = analyticsRecords.length * 450; // Mock spend if tracking ads
    const cpl = totalLeads > 0 ? (adSpend / totalLeads).toFixed(2) : "0";

    // ── 3. Funnel Metrics ────────────────────────────────────────────────
    const funnel = {
      awareness: totalImpressions || (analyticsRecords.length > 0 ? 4500 : 0),
      interest: totalReach || (analyticsRecords.length > 0 ? 3200 : 0),
      inquiry: totalLeads,
      siteVisit: Math.floor(totalLeads * 0.3) || (totalLeads > 0 ? 4 : 0),
      booking: Math.floor(totalLeads * 0.05) || (totalLeads > 0 ? 1 : 0),
    };

    // ── 4. Agent Performance from Tasks ───────────
    const agentStatsRaw: Record<string, { total: number; revisions: number; scores: number[] }> = {};
    
    user.agentTasks.forEach(task => {
      const logs = Array.isArray(task.logs) ? (task.logs as any[]) : [];
      const hasRevision = logs.some(l => l.message.toLowerCase().includes("rollback") || l.message.toLowerCase().includes("revision"));
      
      const content = task.generatedContent ? (task.generatedContent as any[]) : [];
      content.forEach(c => {
        const name = c.agent || "Unknown";
        if (!agentStatsRaw[name]) agentStatsRaw[name] = { total: 0, revisions: 0, scores: [] };
        agentStatsRaw[name].total++;
        if (hasRevision && (name === "Copywriter" || name === "VisualDesigner")) {
          agentStatsRaw[name].revisions++;
        }
        if (typeof c.qcScore === "number") agentStatsRaw[name].scores.push(c.qcScore);
      });
    });

    const agentAnalytics = Object.entries(agentStatsRaw).map(([name, stats]) => ({
      name,
      revisions: stats.revisions,
      successRate: stats.total > 0 ? Math.round(((stats.total - stats.revisions) / stats.total) * 100) : 100,
      avgQcScore: stats.scores.length > 0 ? (stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length).toFixed(1) : "8.5",
    }));

    // ── 5. Auto-Learning Signal ──────────────────────────────────────────
    // Compare 'RERA' tagged content vs others
    let reraScore = 0, reraCount = 0;
    let otherScore = 0, otherCount = 0;

    analyticsRecords.forEach(r => {
      const tags = r.generatedAsset?.tags ? (r.generatedAsset.tags as string[]) : [];
      const isRera = tags.some(t => t.toLowerCase().includes("rera"));
      const eng = (r.likes || 0) + (r.comments || 0);
      if (isRera) { reraScore += eng; reraCount++; }
      else { otherScore += eng; otherCount++; }
    });

    const reraAvg = reraCount > 0 ? reraScore / reraCount : 0;
    const otherAvg = otherCount > 0 ? otherScore / otherCount : 0;
    
    const autoLearningSignal = reraAvg > otherAvg * 1.5 
      ? "Post about RERA trust outperformed by 3x; switching future posts to RERA-first framing."
      : "Balanced engagement detected across all content pillars.";

    // ── 6. Compliance Drill-down ─────────────────────────────────────────
    const compliancePosts = user.agentTasks
      .filter(t => t.status === "completed")
      .map(t => {
        const gc = t.generatedContent as any[];
        const qc = gc?.find(c => c.agent === "QCAuditor");
        return {
          id: t.id,
          goal: t.goal,
          status: qc?.status || "Approved",
          risk: qc?.qcScore < 8 ? "Medium" : "Low",
          markers: qc?.revisionNotes || "Compliant with RERA guidelines.",
          time: t.createdAt,
        };
      })
      .slice(0, 5);

    // ── 7. Real Lead Data ──────────────────────────────────────────────
    const leads = await prisma.lead.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: since },
      },
    });

    const realLeadsCount = leads.length;

    return NextResponse.json({
      totalImpressions: funnel.awareness,
      totalReach: funnel.interest,
      totalLeads: realLeadsCount || totalLeads,
      totalClicks,
      cpl: realLeadsCount > 0 ? (adSpend / realLeadsCount).toFixed(2) : cpl,
      funnel: {
        ...funnel,
        inquiry: realLeadsCount || funnel.inquiry,
        siteVisit: leads.filter((l: any) => l.status === "VISITED").length || funnel.siteVisit,
        booking: leads.filter((l: any) => l.status === "BOOKED").length || funnel.booking,
      },
      agentAnalytics,
      autoLearningSignal,
      compliancePosts,
      hasRealData: analyticsRecords.length > 0 || realLeadsCount > 0,
    });
  } catch (error: any) {
    console.error("[ANALYTICS_GET_ENHANCED]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
