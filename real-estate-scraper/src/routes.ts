import { createPlaywrightRouter } from '@crawlee/playwright';
// eslint-disable-next-line import/no-extraneous-dependencies
import { GoogleGenerativeAI } from '@google/generative-ai';

export const router = createPlaywrightRouter();

// Initialize the Gemini AI Client safely 
// (Ensure process.env.GEMINI_API_KEY is available during the Apify cloud run)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_KEY');

router.addDefaultHandler(async ({ request, page, log, pushData }) => {
    log.info(`Scraping Real Estate Listing: ${request.loadedUrl}`);

    const title = await page.title();
    
    let priceText = 'null';
    let locationText = 'null';

    try {
        // Attempt 1: Fast Static Scraping (Like traditional Crawlee/Apify)
        priceText = await page.locator('.property-price-fast').innerText({ timeout: 2000 });
        locationText = await page.locator('.property-location-fast').innerText({ timeout: 2000 });
        log.info('Successfully found real estate data using strict CSS classes.');
    } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        log.warning(`Target CSS classes changed or failed! Falling back to AI Adaptive Parsing... Error: ${errorMsg}`);
        
        // Attempt 2: "Scrapling" AI Adaptive Pattern using Gemini
        const rawTextChunks = await page.evaluate(() => document.body.innerText.substring(0, 5000));
        log.info(`Feeding ${rawTextChunks.length} characters of lost content to the Gemini Model...`);
        
        try {
            // The AI acts as the fallback "Adaptive Locator"
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const prompt = `
                You are a smart data extraction bot.
                Extract the property price and location from this raw webpage text.
                Return ONLY a valid JSON string with keys "price" and "location". Do not include Markdown blocks.
                If not found, use "null".
                Text:
                ${rawTextChunks}
            `;
            const result = await model.generateContent(prompt);
            const aiResponseRaw = result.response.text().trim();
            const aiParsed = JSON.parse(aiResponseRaw);
            
            priceText = `[AI Found] ${aiParsed.price}`;
            locationText = `[AI Found] ${aiParsed.location}`;
            log.info(`AI Adaptive Parsing successful! Recovered data structure.`);
        } catch (aiError: unknown) {
            log.error(`AI Adaptive Parsing completely failed. Content truly unreadable. Error: ${aiError}`);
            priceText = '[Critical Failure] Data lost';
            locationText = '[Critical Failure] Data lost';
        }
    }

    // Push perfectly formatted JSON directly into Apify's Dataset
    await pushData({
        url: request.loadedUrl,
        title,
        price: priceText,
        locality: locationText,
        scrapedAt: new Date().toISOString(),
    });
});
