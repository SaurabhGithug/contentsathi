import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

// ── Property Type Labels ──────────────────────────────────────────────────
const PROPERTY_LABELS: Record<string, string> = {
  residential_plots: "Residential Plots",
  flats: "Flats / Apartments",
  commercial: "Commercial Property",
  villas: "Villas / Bungalows",
  mixed: "Multiple Property Types",
};

const CUSTOMER_LABELS: Record<string, string> = {
  first_time: "First-time homebuyers",
  investors: "Investors looking for ROI",
  nris: "NRIs looking to invest back home",
  all: "First-time buyers, investors, and NRIs",
};

const USP_LABELS: Record<string, string> = {
  rera: "RERA Approved",
  near_highway: "Near Main Road / Highway",
  affordable: "Affordable Pricing",
  premium: "Premium Location",
  vastu: "Vastu Compliant",
  ready_possession: "Ready Possession",
};

// ── 7-Pillar "Why Buy From Me" Week Plan Template ─────────────────────────
function buildWeekPlan(city: string, propertyType: string, usps: string[]) {
  const propLabel = PROPERTY_LABELS[propertyType] || "property";
  const propLower = propLabel.toLowerCase();
  const uspText = usps.map(u => USP_LABELS[u] || u).slice(0, 3).join(", ");

  return [
    {
      day: 1,
      pillar: "trust",
      pillarLabel: "Trust Building",
      topic: `Why our ${propLower} are the right investment right now — ${uspText}`,
      platform: "Instagram",
      reason: "Trust-building post: establishes credibility on Day 1",
    },
    {
      day: 2,
      pillar: "expertise",
      pillarLabel: "Expert Tip",
      topic: `The ONE thing most buyers miss when buying ${propLower} in ${city}`,
      platform: "LinkedIn",
      reason: "Education post: positions you as the knowledgeable expert",
    },
    {
      day: 3,
      pillar: "proof",
      pillarLabel: "Social Proof",
      topic: `Customer story — "From renting to owning ${propLower} in ${city}"`,
      platform: "Instagram",
      reason: "Social proof: builds credibility through real stories",
    },
    {
      day: 4,
      pillar: "authority",
      pillarLabel: "Authority",
      topic: `5 questions you MUST ask before buying any ${propLower}`,
      platform: "WhatsApp",
      reason: "Authority post: positions you as an advisor, not a salesperson",
    },
    {
      day: 5,
      pillar: "relevance",
      pillarLabel: "Local Expert",
      topic: `What makes ${city} the best place to invest in real estate right now`,
      platform: "LinkedIn",
      reason: "Local expertise: hyper-relevant to your city and audience",
    },
    {
      day: 6,
      pillar: "festival",
      pillarLabel: "Timely",
      topic: `Weekend special offer — free site visit for ${propLower} in ${city}`,
      platform: "Instagram",
      reason: "Timely post: leverages weekends and events for engagement",
    },
    {
      day: 7,
      pillar: "conversion",
      pillarLabel: "Direct CTA",
      topic: `Limited ${propLower} available in ${city} — book your site visit today`,
      platform: "WhatsApp",
      reason: "Conversion post: after 6 days of warmup, now ask for the sale",
    },
  ];
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { propertyType, city, customerType, contentPurpose, usps } = body;

    // Legacy support for old onboarding fields
    const { businessType, specificNiche, location, tone, languages } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── Build Content DNA ──────────────────────────────────────────────────
    const propLabel = PROPERTY_LABELS[propertyType] || propertyType || businessType || "Real Estate";
    const custLabel = CUSTOMER_LABELS[customerType] || customerType || "Home buyers";
    const uspLabels = (usps || []).map((u: string) => USP_LABELS[u] || u);
    const locationVal = city || location || "";

    const contentDna = {
      primaryUsp: `${propLabel} specialist in ${locationVal} with ${uspLabels.join(", ")}`,
      audienceTriggers: customerType === "investors"
        ? ["ROI potential", "appreciation data", "comparison with other investments"]
        : customerType === "nris"
        ? ["trusted RERA compliance", "video walkthroughs", "end-to-end documentation support"]
        : ["dream home emotion", "family safety", "location convenience", "EMI affordability"],
      talkingPoints: uspLabels.slice(0, 3),
      localContext: `${locationVal} real estate market`,
      contentThemes: [
        "Trust building — Why buy from me",
        "Market education — Expert tips",
        "Social proof — Customer stories",
        "Authority — Industry expertise",
        "Local relevance — City insights",
        "Timely content — Festival/Weekend offers",
        "Conversion — Direct CTAs",
      ],
    };

    // ── Upsert ContentBrain ──────────────────────────────────────────────
    await prisma.contentBrain.upsert({
      where: { userId: user.id },
      update: {
        industry: propertyType || businessType || "real_estate",
        location: locationVal,
        tone: tone || "Professional & Trustworthy",
        propertyType: propertyType || null,
        customerType: customerType || null,
        contentPurpose: contentPurpose || null,
        usps: usps || [],
        contentDna: contentDna,
        audienceDescription: custLabel,
        primaryLanguage: (languages?.[0] as any) || "hinglish",
        secondaryLanguage: (languages?.[1] as any) || null,
      },
      create: {
        userId: user.id,
        brandName: user.name || "My Business",
        brandDescription: `${propLabel} business based in ${locationVal}.`,
        industry: propertyType || businessType || "real_estate",
        location: locationVal,
        tone: tone || "Professional & Trustworthy",
        propertyType: propertyType || null,
        customerType: customerType || null,
        contentPurpose: contentPurpose || null,
        usps: usps || [],
        contentDna: contentDna,
        audienceDescription: custLabel,
        primaryLanguage: (languages?.[0] as any) || "hinglish",
        secondaryLanguage: (languages?.[1] as any) || null,
      },
    });

    // ── Generate First Week Plan ─────────────────────────────────────────
    const weekPlan = buildWeekPlan(locationVal, propertyType || "residential_plots", usps || []);

    // Store as ContentSuggestions in DB
    const today = new Date();
    await Promise.allSettled(
      weekPlan.map(async (day) => {
        try {
          await (prisma.contentSuggestion as any).create({
            data: {
              userId: user.id,
              topicSuggestion: day.topic,
              reason: day.reason,
              urgency: day.day <= 2 ? "high" : "medium",
              platform: day.platform.toLowerCase(),
              pillar: day.pillar,
              date: addDays(today, day.day - 1),
            },
          });
        } catch (err) {
          console.error(`[ONBOARDING_PLAN_DAY_${day.day}]`, err);
        }
      })
    );

    // ── Mark Onboarding Complete ──────────────────────────────────────────
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingCompleted: true },
    });

    return NextResponse.json({
      success: true,
      contentDna,
      weekPlan,
    });
  } catch (error: any) {
    console.error("[ONBOARDING_API_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
