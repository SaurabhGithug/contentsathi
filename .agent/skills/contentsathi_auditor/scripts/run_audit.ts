/**
 * ContentSathi Autonomous & Quality Auditor
 * 
 * This script performs a live audit of the database to calculate:
 * 1. Autonomous Success Rate
 * 2. Quality-to-Quantity Ratio
 * 3. Freshness Variance
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ Error: DATABASE_URL is missing in .env");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runAudit() {
  console.log("🚀 Starting ContentSathi Core Audit...\n");

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Fetching Stats
  const totalAssets = await prisma.generatedAsset.count();
  const recentAssets = await prisma.generatedAsset.findMany({
    where: { createdAt: { gte: sevenDaysAgo } }
  });

  const goldenExamples = await prisma.goldenExample.count();
  const marketIntelCount = await prisma.marketIntelligence.count();
  const freshIntelCount = await prisma.marketIntelligence.count({
    where: { scrapedAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }
  });

  // 2. Calculating Quality
  const avgQuality = recentAssets.length > 0
    ? recentAssets.reduce((acc, curr) => acc + (curr.qualityScore || 0), 0) / recentAssets.length
    : 0;

  const lowQualityAssets = recentAssets.filter(a => (a.qualityScore || 0) < 70).length;

  // 3. Autonomy Metrics
  const agentTasks = await prisma.agentTask.findMany({
    where: { createdAt: { gte: sevenDaysAgo } }
  });
  const completedTasks = agentTasks.filter(t => t.status === 'completed').length;
  const autonomyRate = agentTasks.length > 0 ? (completedTasks / agentTasks.length) * 100 : 0;

  // 4. Reporting
  console.log("══════════════════════════════════════════════════");
  console.log("📊 AUDIT SUMMARY (Last 7 Days)");
  console.log("══════════════════════════════════════════════════");
  
  console.log(`\n[AUTONOMY]`);
  console.log(`- Active Agents: 7 (Gravity Claw)`);
  console.log(`- Total Tasks Triggered: ${agentTasks.length}`);
  console.log(`- Success Rate: ${autonomyRate.toFixed(1)}%`);
  console.log(`- Autonomous Level: ${autonomyRate > 90 ? 'L4 (High Autonomy)' : 'L2 (Semi-Assisted)'}`);

  console.log(`\n[QUALITY VS QUANTITY]`);
  console.log(`- Total Assets Generated: ${recentAssets.length}`);
  console.log(`- Average Quality Score: ${avgQuality.toFixed(1)}/100`);
  console.log(`- Quality-to-Quantity Ratio: ${((avgQuality / 100) * (recentAssets.length / (totalAssets || 1))).toFixed(2)}`);
  console.log(`- Issues Detected: ${lowQualityAssets} assets below threshold`);

  console.log(`\n[INTELLIGENCE FRESHNESS]`);
  console.log(`- Live Signals in DB: ${marketIntelCount}`);
  console.log(`- 24h Freshness Index: ${((freshIntelCount / (marketIntelCount || 1)) * 100).toFixed(1)}%`);
  console.log(`- Disruption Potential: ${freshIntelCount > 50 ? 'HIGH' : 'LOW'}`);

  console.log(`\n[LEARNING LOOP]`);
  console.log(`- Golden Examples (Brain): ${goldenExamples}`);
  console.log(`- Self-Healing Level: ${goldenExamples > 10 ? 'Active' : 'Initializing'}`);

  console.log("\n══════════════════════════════════════════════════");
  console.log("📝 IMPROVEMENT RECOMMENDATIONS");
  
  if (autonomyRate < 85) {
    console.log("⚠️  URGENT: Agent failure rates are high. Check 'AgentTask' error logs.");
  }
  if (avgQuality < 75) {
    console.log("⚠️  QUALITY GAP: Content is becoming formulaic. Increase 'Golden Example' injection.");
  }
  if (freshIntelCount < 20) {
    console.log("⚠️  DATA STALE: Apify scrapers are not refreshing enough. Check CRON schedules.");
  }
  if (recentAssets.length > 100 && avgQuality < 80) {
    console.log("💡 STRATEGY: System is producing 'Quantity' over 'Quality'. Tighten QC Auditor constraints.");
  }

  console.log("══════════════════════════════════════════════════\n");
}

runAudit()
  .catch(e => {
    console.error("Audit failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
