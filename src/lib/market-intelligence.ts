import { ApifyClient } from 'apify-client';
import { prisma } from '@/lib/prisma';
import { searchWeb } from '@/lib/tavily';
import { MarketSignal } from '@/types/market';

const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

export async function fetchSocialIntelligence(userId: string): Promise<MarketSignal[]> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { contentBrain: true },
    });

    if (!user || !user.contentBrain) {
        throw new Error('User or ContentBrain not found');
    }

    const brain = user.contentBrain;
    const location = brain.location || 'Nagpur';
    const industry = brain.industry || 'Real Estate';
    const contentDna = brain.contentDna as any || {};
    
    // Extract keywords for LinkedIn
    let keywords = [];
    if (contentDna.themes && Array.isArray(contentDna.themes)) {
        keywords = contentDna.themes.slice(0, 2);
    }
    if (keywords.length === 0) {
        keywords.push(`${location} ${industry}`);
    }
    
    // Extract hashtags for Instagram
    const hashtags = [
        location.replace(/\s+/g, '').toLowerCase(), 
        industry.replace(/\s+/g, '').toLowerCase()
    ];
    
    let signals: MarketSignal[] = [];

    try {
        console.log(`[MarketIntelligence] Scraping Apify for userId=${userId} with timeout 55s...`);
        const fetchApify = async () => {
             // 1. LinkedIn Scraper (benjarapi/linkedin-post-search)
             const liRun = apifyClient.actor('benjarapi/linkedin-post-search').call({
                 search: keywords.join(' '),
                 maxResults: 10
             });
             
             // 2. Instagram Scraper (apify/instagram-hashtag-scraper)
             const igRun = apifyClient.actor('apify/instagram-hashtag-scraper').call({
                 hashtags: hashtags,
                 resultsLimit: 10
             });
             
             const [liResult, igResult] = await Promise.all([liRun, igRun]);
             
             const liItems = (await apifyClient.dataset(liResult.defaultDatasetId).listItems()).items;
             const igItems = (await apifyClient.dataset(igResult.defaultDatasetId).listItems()).items;
             
             const rawSignals: MarketSignal[] = [];
             
             for (const item of liItems) {
                 const text = item.text || item.content;
                 if (text) {
                     rawSignals.push({
                         platform: 'linkedin',
                         postText: String(text).substring(0, 1000), // truncate for safety
                         likes: Number(item.numLikes || item.likes || 0),
                         comments: Number(item.numComments || item.comments || 0),
                         shares: Number(item.numShares || item.shares || 0),
                         hashtags: [] as string[],
                         scrapedAt: new Date()
                     });
                 }
             }

             for (const item of igItems) {
                 if (item.caption) {
                     rawSignals.push({
                         platform: 'instagram',
                         postText: String(item.caption).substring(0, 1000), // truncate
                         likes: Number(item.likesCount || 0),
                         comments: Number(item.commentsCount || 0),
                         shares: 0,
                         hashtags: (item.hashtags as string[]) || [],
                         scrapedAt: new Date()
                     });
                 }
             }
             return rawSignals;
        };

        const timeoutPromise = new Promise<MarketSignal[]>((_, reject) => 
            setTimeout(() => reject(new Error('Apify timeout')), 55000)
        );
        
        signals = await Promise.race([fetchApify(), timeoutPromise]);

        if (signals.length >= 5) {
            console.log(`[MarketIntelligence] Apify success: found ${signals.length} signals.`);
            // Save to DB
            await prisma.marketIntelligence.createMany({
                data: signals.map(s => ({
                    userId,
                    platform: s.platform,
                    content: s.postText,
                    likes: s.likes,
                    comments: s.comments,
                    shares: s.shares,
                    source: 'APIFY'
                }))
            });

            return signals;
        } else {
            console.log(`[MarketIntelligence] Apify returned ${signals.length} results (<5). Falling back to Tavily...`);
        }
    } catch (error: any) {
         console.log(`[MarketIntelligence] Apify failed: ${error.message}. Falling back to Tavily...`);
    }

    // Fallback to Tavily
    const searchResults = await searchWeb(
        `Latest ${location} ${industry} market trends, infrastructure news, and property rates March 2026`,
        "advanced",
        true
    );

    signals = searchResults.results.map(r => ({
        platform: 'web',
        postText: `${r.title}: ${r.content}`.substring(0, 1000),
        likes: 0,
        comments: 0,
        shares: 0,
        hashtags: [] as string[],
        scrapedAt: new Date()
    }));

    if (signals.length > 0) {
        await prisma.marketIntelligence.createMany({
            data: signals.map(s => ({
                userId,
                platform: s.platform,
                content: s.postText,
                source: 'TAVILY'
            }))
        });
    }

    return signals;
}
