import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addDays, format, startOfWeek, getDay, setHours, setMinutes } from "date-fns";

// ── Optimal posting schedule based on RE audience behaviour ──────────────────
const OPTIMAL_SLOTS: Record<string, { days: number[]; hour: number; minute: number; reason: string }[]> = {
  instagram: [
    { days: [2, 4], hour: 9,  minute: 0,  reason: "Tue/Thu 9 AM — peak RE browsing before office" },
    { days: [6],   hour: 10, minute: 30, reason: "Sat 10:30 AM — weekend site visit inspiration" },
  ],
  linkedin: [
    { days: [2, 4], hour: 8,  minute: 0,  reason: "Tue/Thu 8 AM — professional RE decision makers" },
    { days: [1],   hour: 12, minute: 0,  reason: "Mon 12 PM — week-start investment mindset" },
  ],
  whatsapp: [
    { days: [5],   hour: 17, minute: 0,  reason: "Fri 5 PM — weekend planning / site visit invite" },
    { days: [0],   hour: 10, minute: 0,  reason: "Sun 10 AM — family discussions peak" },
  ],
  youtube: [
    { days: [6, 0], hour: 11, minute: 0, reason: "Sat/Sun 11 AM — leisure property research" },
  ],
};

// ── Sensitive events to pause scheduling ─────────────────────────────────────
const SENSITIVE_EVENTS: { label: string; dates: string[] }[] = [
  { label: "Election Results Day", dates: [] },  // populated dynamically
  { label: "National Disaster", dates: [] },
];

// ── Content gap suggestions ───────────────────────────────────────────────────
const CONTENT_SUGGESTIONS = [
  { platform: "instagram", angle: "Gudi Padwa countdown: 13 days to Nagpur's biggest buying window", pillar: "urgency", score: 95 },
  { platform: "linkedin",  angle: "NRI April investment cycle starts: Why Indian land outperforms US savings accounts", pillar: "NRI", score: 92 },
  { platform: "whatsapp",  angle: "Weekend site visit invite: Saraswati Nagri, Sunday 10 AM", pillar: "conversion", score: 90 },
  { platform: "instagram", angle: "Behind the scenes: How RERA-compliant plot layouts are designed", pillar: "trust", score: 88 },
  { platform: "linkedin",  angle: "MIHAN job announcement analysis: Impact on Wardha Road land prices", pillar: "authority", score: 85 },
  { platform: "instagram", angle: "Buyer story: IT professional from Pune who bought in Nagpur", pillar: "proof", score: 82 },
  { platform: "whatsapp",  angle: "This week's NRI inquiry summary — what questions are coming in", pillar: "social proof", score: 78 },
];

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        socialAccounts: { select: { platform: true, isActive: true } },
        contentBrain: { select: { brandName: true, location: true } },
        calendarItems: {
          where: { scheduledAt: { gte: new Date() } },
          select: { id: true, scheduledAt: true, platform: true, status: true },
          orderBy: { scheduledAt: "asc" },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Find which platforms are connected
    const activePlatforms = user.socialAccounts
      .filter(a => a.isActive)
      .map(a => a.platform.toLowerCase());

    // Find which slots are already filled
    const existingScheduled = user.calendarItems.map(ci => ({
      platform: ci.platform.toLowerCase(),
      scheduledAt: ci.scheduledAt,
    }));

    // Generate recommended empty slots for the next 7 days
    const recommendations: {
      platform: string;
      scheduledAt: Date;
      reason: string;
      suggestion: typeof CONTENT_SUGGESTIONS[number] | null;
    }[] = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = addDays(weekStart, dayOffset);
      const dayOfWeek = getDay(targetDate); // 0=Sun, 1=Mon, ... 6=Sat

      for (const [platform, slots] of Object.entries(OPTIMAL_SLOTS)) {
        if (activePlatforms.length > 0 && !activePlatforms.includes(platform)) continue;

        for (const slot of slots) {
          if (!slot.days.includes(dayOfWeek)) continue;

          let slotTime = setHours(setMinutes(targetDate, slot.minute), slot.hour);

          // Skip if already past
          if (slotTime <= now) continue;

          // Skip if already scheduled within 2 hours of this slot
          const alreadyBooked = existingScheduled.some(es =>
            es.platform === platform &&
            Math.abs((es.scheduledAt?.getTime() ?? 0) - slotTime.getTime()) < 2 * 60 * 60 * 1000
          );
          if (alreadyBooked) continue;

          // Find the best content suggestion for this platform
          const suggestion = CONTENT_SUGGESTIONS.find(s => s.platform === platform) ?? null;

          recommendations.push({ platform, scheduledAt: slotTime, reason: slot.reason, suggestion });
        }
      }
    }

    // Sort by scheduled time
    recommendations.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

    // Frequency check: never suggest >2 posts in same day on same platform
    const filtered: typeof recommendations = [];
    const dayPlatformCount: Record<string, number> = {};
    for (const rec of recommendations) {
      const key = `${format(rec.scheduledAt, "yyyy-MM-dd")}_${rec.platform}`;
      dayPlatformCount[key] = (dayPlatformCount[key] ?? 0) + 1;
      if (dayPlatformCount[key] <= 1) {
        filtered.push(rec);
      }
    }

    return NextResponse.json({
      recommendations: filtered.slice(0, 10),
      existingCount: user.calendarItems.length,
      activePlatforms,
      optimalSlots: OPTIMAL_SLOTS,
    });
  } catch (error: any) {
    console.error("Auto-schedule error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Auto-fill the calendar with AI-suggested posts in optimal slots
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { slots } = body as { slots: { platform: string; scheduledAt: string; angle: string }[] };

    if (!slots || !Array.isArray(slots)) {
      return NextResponse.json({ error: "slots array required" }, { status: 400 });
    }

    // Create calendar items as 'draft' suggestions
    const created = await Promise.all(
      slots.map(slot =>
        prisma.calendarItem.create({
          data: {
            userId: user.id,
            platform: slot.platform.toUpperCase() as any,
            status: "draft",
            scheduledAt: new Date(slot.scheduledAt),
            notes: slot.angle,
            isSuggested: true,
          },
        })
      )
    );

    return NextResponse.json({ created: created.length, items: created });
  } catch (error: any) {
    console.error("Auto-schedule POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
