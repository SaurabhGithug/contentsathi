import { prisma } from "@/lib/db/prisma";

export type AlertEvent = {
  type: string;
  message: string;
  userId?: string;
  severity: "LOW" | "HIGH" | "CRITICAL";
};

export async function notifyFounder(event: AlertEvent) {
  try {
    // 1. Log to database
    await prisma.systemAlert.create({
      data: {
        type: event.type,
        message: event.message,
        severity: event.severity,
      },
      // Note: intentionally fire-and-forget, but awaited here to ensure creation
    });

    // 2. Fire-and-forget webhook
    if (event.severity === "HIGH" || event.severity === "CRITICAL") {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      if (webhookUrl) {
        // Fire and forget
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `**[${event.severity}] ${event.type}**\n${event.message}${event.userId ? `\nUser: ${event.userId}` : ""}`,
          }),
        }).catch((err) => console.error("Discord webhook failed", err));
      }
    }
  } catch (error) {
    console.error("Failed to process notifyFounder", error);
  }
}

export async function isSystemPaused(): Promise<boolean> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: "GLOBAL_PAUSE" },
    });
    if (!config) return false;
    return config.value === "true";
  } catch {
    // If table doesn't exist or DB issue, assume false so system keeps running
    return false;
  }
}

export async function toggleSystemPause(pause: boolean): Promise<boolean> {
  try {
    const newValue = pause ? "true" : "false";
    await prisma.systemConfig.upsert({
      where: { key: "GLOBAL_PAUSE" },
      update: { value: newValue },
      create: { key: "GLOBAL_PAUSE", value: newValue },
    });
    return pause;
  } catch (err) {
    console.error("Failed to toggle system pause", err);
    return false;
  }
}
