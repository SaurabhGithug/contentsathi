import { NextResponse } from "next/server";
import { ApifyClient } from "apify-client";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "No target URL provided." }, { status: 400 });
    }

    // 1. Initialize Apify Client
    const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

    console.log(`[Market Watch] Triggering Crawler for URL: ${url}`);

    // 2. Call the deployed Actor (Synchronously wait for it to finish)
    // Replace "ingenuous_gymnast" with the actual Apify username if different.
    const run = await client.actor("ingenuous_gymnast/real-estate-scraper").call({
      startUrls: [{ url }],
      maxRequestsPerCrawl: 10,
    });

    console.log(`[Market Watch] Crawl Complete. Run ID: ${run.id}`);

    // 3. Fetch the results from the Apify Dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      return NextResponse.json({ message: "No items scraped." }, { status: 200 });
    }

    // 4. Inject into the PlotComparable Database table
    for (const item of items) {
      // Cast fields to string for database safety
      const locality = typeof item.locality === 'string' ? item.locality : 
                      (typeof item.locality === 'object' && item.locality !== null) ? JSON.stringify(item.locality) : 
                      String(item.locality || "");

      await prisma.plotComparable.create({
        data: {
          userId: "admin", // Depending on who triggered it
          corridor: String(locality || "Unknown"),
          source: "apify",
          sourceUrl: String(item.url || url || ""),
          title: String(item.title || ""),
          priceLabel: String(item.price || ""),
          scrapedAt: new Date(String(item.scrapedAt || Date.now())),
        },
      });
    }

    return NextResponse.json({
      success: true,
      messages: `Successfully scraped ${items.length} items and synced with ContentSathi.`,
      data: items,
    });
  } catch (error: any) {
    console.error("[Market Watch Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
