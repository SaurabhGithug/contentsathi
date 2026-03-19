import { marketHunter } from "@/lib/intelligence/social-scraper";
import { prisma } from "@/lib/db/prisma";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

async function testHunter() {
    console.log("🚀 Starting Market Hunter Live Test...");
    
    // Find a test user
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error("❌ No user found in DB for testing.");
        return;
    }

    console.log(`🔍 Hunting for 'Nagpur Plots' as user: ${user.email}`);

    try {
        const results = await marketHunter("top 5 linkedin posts about nagpur plots", user.id);
        
        console.log(`✅ Success! Found ${results.length} posts.`);
        
        results.forEach((post, i) => {
            console.log(`\n--- Post #${i + 1} ---`);
            console.log(`Author: ${post.author}`);
            console.log(`Stats: ${post.likes} L, ${post.comments} C, ${post.shares} S`);
            console.log(`URL: ${post.url}`);
            console.log(`Snippet: ${post.text.substring(0, 100)}...`);
        });

        // Verify DB persistence
        const rowCount = await prisma.marketIntelligence.count({
            where: { userId: user.id }
        });
        console.log(`\n📊 DB Verification: ${rowCount} total entries in market_intelligence.`);

    } catch (error) {
        console.error("❌ Test Failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testHunter();
