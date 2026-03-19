import { prisma } from "@/lib/db/prisma";

/**
 * Detects if a user query is about platform operations (accounts, stats, status)
 */
export function isOperationalQuery(message: string): boolean {
  const lower = message.toLowerCase();
  
  // Specific functional keywords that should bypass AI
  const keywords = [
    "connected", "account", "social account", "linkedin", "instagram", "whatsapp",
    "is my", "check my", "show my", "how many", "how much", "status",
    "posts generated", "content generated", "pipeline", "credits",
    "published", "scheduled", "pending", "approvals", "connected accounts",
    "mera account", "linked hai", "connect hua", "kitne posts", "limit", "billing"
  ];
  
  // Guard: If it's a very long query, it's likely a content generation prompt, not an op check
  if (message.length > 150) return false;

  return keywords.some((t) => lower.includes(t));
}

/**
 * Runs a direct database query for operational info
 */
export async function runOperationalQuery(message: string, userId: string): Promise<string | null> {
  const lower = message.toLowerCase();
  
  try {
    const isAccountQuery = ["connect", "account", "linkedin", "instagram", "whatsapp", "linked", "mera account", "social"]
      .some((k) => lower.includes(k));

    if (isAccountQuery) {
      const accounts = await (prisma as any).socialAccount.findMany({
        where: { userId },
        select: { platform: true, accountName: true, isActive: true, tokenExpiry: true },
      }).catch(() => []);

      if (accounts.length === 0) {
        return `**No social accounts connected yet.**\n\nI can't post for you until you link a platform. Go to **Settings → Accounts** to connect your LinkedIn, Instagram, or WhatsApp.`;
      }

      const emoji: Record<string, string> = { linkedin: "💼", instagram: "📸", whatsapp: "💬", twitter: "🐦", x: "🐦", youtube: "▶️", facebook: "👥" };
      const lines = accounts.map((a: any) => {
        const expired = a.tokenExpiry && new Date(a.tokenExpiry) < new Date();
        const status = !a.isActive ? "❌ Disconnected" : expired ? "⚠️ Token expired — reconnect" : "✅ Connected";
        const name = a.platform?.charAt(0).toUpperCase() + a.platform?.slice(1);
        return `${emoji[a.platform?.toLowerCase()] || "🔗"} **${name}** — ${a.accountName || "Unknown"} · ${status}`;
      });

      return `### 🔗 Connected Platforms\n\n${lines.join("\n")}\n\n*You can manage these anytime in **Settings → Accounts**.*`;
    }

    const isStatsQuery = ["posts", "content", "generated", "published", "kitne", "pipeline", "stats", "count"]
      .some((k) => lower.includes(k));

    if (isStatsQuery) {
      const [total, published, pending] = await Promise.all([
        prisma.generatedAsset.count({ where: { userId } }).catch(() => 0),
        prisma.publishLog.count({ where: { userId, status: "SUCCESS" } }).catch(() => 0),
        prisma.calendarItem.count({ where: { userId, status: { in: ["draft", "ready"] } } }).catch(() => 0),
      ]);
      
      return `### 📊 Content Snapshot\n\n| Item | Count |\n|---|---|\n| **Total Generated** | ${total} |\n| **Live on Social** | ${published} |\n| **In Queue / Drafts** | ${pending} |\n\n*Want to see more? Check your **Analytics** dashboard.*`;
    }
  } catch (e: any) {
    console.error("[CAO_OPS] Error:", e.message);
  }
  
  return null;
}
