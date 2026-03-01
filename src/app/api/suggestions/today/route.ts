import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await (prisma.user as any).findUnique({ 
        where: { email: session.user.email },
        include: { contentBrain: true }
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const now = new Date();
    const twoWeeksLater = addDays(now, 14);

    // 1. Fetch upcoming festivals
    const upcomingFestivals = await (prisma as any).festivalCalendar.findMany({
      where: {
        date: {
          gte: startOfDay(now),
          lte: endOfDay(twoWeeksLater),
        }
      },
      orderBy: { date: "asc" }
    });

    const suggestions: any[] = [];

    // Rule 1: Festival Suggestions
    if (upcomingFestivals.length > 0) {
        const festival = upcomingFestivals[0];
        suggestions.push({
            id: `fest-${festival.id}`,
            type: "festival",
            title: `${festival.name} Post`,
            description: festival.contentAngle || `Upcoming festival: ${festival.name}. Great time for a special offer!`,
            urgency: festival.date.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000 ? "high" : "medium",
            topic: festival.suggestedTopics?.[0] || `Celebrating ${festival.name}`,
            platform: "Instagram",
            festivalTag: festival.name
        });
    }

    // Rule 2: Locality / Market Insight
    if (user.contentBrain?.location?.includes("Nagpur")) {
        const localities = await (prisma as any).nagpurLocality.findMany({ take: 3 });
        const randomLoc = localities[Math.floor(Math.random() * localities.length)];
        
        if (randomLoc) {
            suggestions.push({
                id: `market-${randomLoc.id}`,
                type: "market_insight",
                title: `${randomLoc.name} Growth Focus`,
                description: `Highlight ${randomLoc.name}'s ${randomLoc.appreciationYoY} appreciation and ${randomLoc.upcomingInfra?.[0] || "infrastructure growth"}.`,
                urgency: "medium",
                topic: `Why ${randomLoc.name} is the best place to invest in Nagpur right now`,
                platform: "LinkedIn"
            });
        }
    }

    // Rule 3: Maintenance / Education
    suggestions.push({
        id: "edu-1",
        type: "educational",
        title: "Investment Tip",
        description: "Educate your audience on the difference between RERA and NIT/AMRDA sanctions.",
        urgency: "low",
        topic: "What every plot buyer must check before payment",
        platform: "WhatsApp"
    });

    return NextResponse.json(suggestions.slice(0, 3));
  } catch (error: any) {
    console.error("[SUGGESTIONS_ERROR]", error);
    return NextResponse.json({ error: "Failed to load suggestions" }, { status: 500 });
  }
}
