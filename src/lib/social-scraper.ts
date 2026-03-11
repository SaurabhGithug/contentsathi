import { ApifyClient } from 'apify-client';
import { prisma } from "@/lib/prisma";

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

export type SocialPost = {
    url: string;
    text: string;
    author: string;
    likes: number;
    comments: number;
    shares: number;
    postedAt: string;
    platform: 'linkedin' | 'instagram' | 'twitter';
};

/**
 * The Market Hunter Core: Fetches real-time LinkedIn posts via Apify.
 * Uses the supreme_coder/linkedin-post actor (No-cookie version).
 */
export async function fetchLinkedInPosts(query: string, userId?: string, limit: number = 5): Promise<SocialPost[]> {
    if (!process.env.APIFY_API_TOKEN) {
        throw new Error("APIFY_API_TOKEN is missing.");
    }

    try {
        const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(query)}&origin=SWITCH_SEARCH_VERTICAL`;

        const input = {
            "urls": [searchUrl],
            "limitPerSource": limit,
            "deepScrape": true,
            "minDelay": 2,
            "maxDelay": 5,
            "proxyConfiguration": {
                "useApifyProxy": true
            }
        };

        const run = await client.actor("supreme_coder/linkedin-post").call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        const posts: SocialPost[] = items.map((item: any) => ({
            url: item.url || item.postUrl,
            text: item.text || item.content || "",
            author: item.authorName || item.author?.name || "Unknown",
            likes: item.numLikes || item.reactionsCount || 0,
            comments: item.numComments || item.commentsCount || 0,
            shares: item.numShares || item.repostsCount || 0,
            postedAt: item.postedAtISO || item.createdAt || new Date().toISOString(),
            platform: 'linkedin'
        }));

        // PERSISTENCE: Save to DB for deep analysis later
        if (userId && posts.length > 0) {
            await Promise.all(posts.map(post => 
                prisma.marketIntelligence.create({
                    data: {
                        userId,
                        platform: post.platform,
                        postUrl: post.url,
                        author: post.author,
                        content: post.text,
                        likes: post.likes,
                        comments: post.comments,
                        shares: post.shares,
                        postedAt: new Date(post.postedAt),
                        engagementScore: (post.likes + post.comments * 2 + post.shares * 3),
                        metadata: { scraped_query: query }
                    }
                }).catch((e: any) => console.error("Failed to save market intel:", e))
            ));
        }

        return posts;
    } catch (error) {
        console.error("Apify LinkedIn Scraper Failed:", error);
        return [];
    }
}

/**
 * Orchestrator: Decides which platform to hunt based on user intent.
 */
export async function marketHunter(intent: string, userId?: string): Promise<SocialPost[]> {
    const isLinkedIn = intent.toLowerCase().includes("linkedin");
    
    if (isLinkedIn || intent.toLowerCase().includes("post") || intent.toLowerCase().includes("social")) {
        const subject = intent.replace(/search|linkedin|posts|top|5|latest/gi, "").trim();
        return await fetchLinkedInPosts(subject || "Nagpur Real Estate", userId);
    }

    return [];
}
