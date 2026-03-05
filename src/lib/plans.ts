// ─── Contentsathi Plan Configuration ────────────────────────────────────
// All pricing in INR. -1 means unlimited.

export type PlanTierKey = "free" | "starter" | "creator" | "agency";

export interface PlanConfig {
  name: string;
  priceMonthly: number;
  priceYearly: number;
  monthlyCredits: number;
  socialAccounts: number;
  scheduledPostsLimit: number;
  platforms: string[];
  teamMembers?: number;
  features: {
    youtubeResearch: boolean;
    whatsappBroadcast: boolean;
    websiteBlocks: boolean;
    analytics: boolean;
    bulkExport: boolean;
    customTemplates: number; // -1 = unlimited
    goldenExamples: number;  // -1 = unlimited
    prioritySupport?: boolean;
    saraswatiNagariPreset?: boolean;
    whiteLabel?: boolean;
    apiAccess?: boolean;
    onboarding?: boolean;
  };
}

export const PLANS: Record<PlanTierKey, PlanConfig> = {
  free: {
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    monthlyCredits: 100,
    socialAccounts: 2,
    scheduledPostsLimit: 10,
    platforms: ["instagram", "linkedin"],
    features: {
      youtubeResearch: false,
      whatsappBroadcast: false,
      websiteBlocks: false,
      analytics: false,
      bulkExport: false,
      customTemplates: 3,
      goldenExamples: 3,
    },
  },
  starter: {
    name: "Starter",
    priceMonthly: 799,
    priceYearly: 7990,
    monthlyCredits: 1500,
    socialAccounts: 5,
    scheduledPostsLimit: 100,
    platforms: ["instagram", "linkedin", "x", "facebook", "whatsapp"],
    features: {
      youtubeResearch: true,
      whatsappBroadcast: true,
      websiteBlocks: false,
      analytics: true,
      bulkExport: true,
      customTemplates: 20,
      goldenExamples: 10,
    },
  },
  creator: {
    name: "Creator",
    priceMonthly: 1999,
    priceYearly: 19990,
    monthlyCredits: 5000,
    socialAccounts: 10,
    scheduledPostsLimit: -1,
    platforms: ["instagram", "linkedin", "x", "facebook", "whatsapp", "youtube"],
    features: {
      youtubeResearch: true,
      whatsappBroadcast: true,
      websiteBlocks: true,
      analytics: true,
      bulkExport: true,
      customTemplates: -1,
      goldenExamples: -1,
      prioritySupport: true,
      saraswatiNagariPreset: true,
    },
  },
  agency: {
    name: "Agency",
    priceMonthly: 4999,
    priceYearly: 49990,
    monthlyCredits: -1,
    socialAccounts: -1,
    scheduledPostsLimit: -1,
    platforms: ["instagram", "linkedin", "x", "facebook", "whatsapp", "youtube"],
    teamMembers: 5,
    features: {
      youtubeResearch: true,
      whatsappBroadcast: true,
      websiteBlocks: true,
      analytics: true,
      bulkExport: true,
      customTemplates: -1,
      goldenExamples: -1,
      prioritySupport: true,
      whiteLabel: true,
      apiAccess: true,
      onboarding: true,
    },
  },
};

// ─── Credit Costs ─────────────────────────────────────────────────────────

export const CREDIT_COSTS: Record<string, number> = {
  generate_campaign: 10,
  repurpose_content: 8,
  single_post_regenerate: 3,
  translate_post: 2,
  image_generation: 5,
  quality_check: 1,
  whatsapp_broadcast_per10: 2,
  weekly_ai_insight: 0,
};

// ─── GST Rate ──────────────────────────────────────────────────────────────

export const GST_RATE = 0.18;

// ─── Helper to calculate final amount with GST ─────────────────────────────

export function calculateAmountWithGST(baseAmount: number): {
  base: number;
  gst: number;
  total: number;
} {
  const gst = Math.round(baseAmount * GST_RATE);
  return { base: baseAmount, gst, total: baseAmount + gst };
}

// ─── Get plan price for billing cycle ──────────────────────────────────────

export function getPlanPrice(
  tier: PlanTierKey,
  cycle: "monthly" | "yearly"
): number {
  const plan = PLANS[tier];
  return cycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
}
