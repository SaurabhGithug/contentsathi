import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
import { callGemini } from "@/lib/ai/gemini";
import { SYSTEM_PROMPT_BASE, buildRepurposeDetailedPrompt } from "@/lib/ai/prompts";
import { prisma } from "@/lib/db/prisma";
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import { extractVideoId, fetchTranscript } from "@/lib/ai/youtube";
import { sanitizeText } from "@/lib/utils/sanitize";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url: rawUrl, researchContext: rawResearchContext } = body;

    const url = rawUrl ? sanitizeText(rawUrl, 1000) : undefined;
    const researchContext = rawResearchContext ? sanitizeText(rawResearchContext, 5000) : undefined;

    if (!url && !researchContext) {
      return NextResponse.json({ error: "Either a URL or YouTube research context is required" }, { status: 400 });
    }

    // 1. Detect source type and fetch content
    let sourceContentText = "";
    const videoId = url ? extractVideoId(url) : null;

    if (videoId) {
      // YouTube Mode
      sourceContentText = await fetchTranscript(videoId);
      if (!sourceContentText) {
        return NextResponse.json({ error: "Could not fetch transcript for this YouTube video." }, { status: 400 });
      }
      sourceContentText = `## YouTube Transcript\n${sourceContentText}`;
    } else if (url) {
      // Standard Scraping Mode with M2: timeout, graceful 403, meta extraction
      let html: string;
      let pageMeta: { title?: string; description?: string; ogImage?: string } = {};
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        if (response.status === 403 || response.status === 401) {
          return NextResponse.json({ 
            error: "This page blocked automated access (403 Forbidden). Please paste the article text manually in the Text tab." 
          }, { status: 400 });
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        html = await response.text();
      } catch (err: any) {
        if (err.name === "AbortError") {
          return NextResponse.json({ 
            error: "The page took too long to load (timeout). Please paste the text manually." 
          }, { status: 400 });
        }
        return NextResponse.json({ 
          error: "Could not read this URL. It may require JavaScript or login. Please paste the text manually." 
        }, { status: 400 });
      }

      const $ = cheerio.load(html);
      // M3: Extract meta tags for preview
      pageMeta.title = $("meta[property='og:title']").attr("content") || $("title").text() || undefined;
      pageMeta.description = $("meta[property='og:description']").attr("content") || $("meta[name='description']").attr("content") || undefined;
      pageMeta.ogImage = $("meta[property='og:image']").attr("content") || undefined;

      $("script, style, nav, footer, header, noscript, iframe, [class*='cookie'], [class*='popup'], [id*='newsletter']").remove();
      let cleanText = $("article, main, .content, .post-body, .article-content, [class*='article'], [class*='blog']").text().trim();
      if (!cleanText || cleanText.length < 200) cleanText = $("body").text().trim();
      cleanText = cleanText.replace(/\s+/g, " ").substring(0, 15000);

      if (!cleanText || cleanText.length < 50) {
        return NextResponse.json({ 
          error: "Could not extract readable text from this URL. It may be a JavaScript-heavy page. Please paste the text manually." 
        }, { status: 400 });
      }
      sourceContentText = `## Scraped Content\n${cleanText}`;
      // Attach pageMeta to be returned later after generation
      (global as any).__lastScrapedMeta = pageMeta;
    }

    // Combine with research context if provided
    const sourceContent = researchContext
      ? `## YouTube Research Context (Top Related Videos)\n${researchContext}\n\n${sourceContentText}`
      : sourceContentText;

    // 3. User Context & Gemini
    let brain: any = null;
    let userId: string | null = null;
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (user) {
        userId = user.id;
        brain = await prisma.contentBrain.findUnique({ where: { userId: user.id } });
      }
    }

    const ctaList = brain?.ctaList ? JSON.parse(brain.ctaList) : [];

    const userPrompt = buildRepurposeDetailedPrompt({
      sourceContent,
      brandName: brain?.brandName || undefined,
      brandVoice: brain?.tone || undefined,
      niche: brain?.niche || undefined,
      ctaList,
      contactInfo: brain?.phoneNumber || brain?.email || undefined,
    });

    const result = await callGemini(SYSTEM_PROMPT_BASE, userPrompt);

    // ── Generate Image Prompts for each post ──
    if (result.posts && result.posts.length > 0) {
      await Promise.all(
        result.posts.map(async (post) => {
          try {
            const promptInstruction = "Write a Stable Diffusion image prompt for this Indian real estate social post. Under 50 words. Warm colours, professional, Indian context. Return ONLY the prompt text, no quotes or intro.";
            const apiKey = process.env.GEMINI_API_KEY;
            if (apiKey && apiKey.startsWith("AIza")) {
              const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: `${promptInstruction}\n\nPOST TEXT:\n${post.body}` }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 100 },
                  }),
                }
              );
              if (res.ok) {
                const data = await res.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) post.imagePrompt = text.trim();
              }
            }
          } catch (e) {
            console.error("Failed to generate image prompt for post", post.id, e);
          }
        })
      );
    }

    // ── E6: Auto-save repurposed (from URL) posts to GeneratedAsset DB ────
    if (userId && result.posts && result.posts.length > 0) {
      await Promise.allSettled(
        result.posts.map(async (post: any) => {
          try {
            let platform = (post.platform || "instagram").toLowerCase() as any;
            if (platform.includes("youtube")) platform = "youtube";
            else if (platform.includes("twitter") || platform === "x") platform = "x";
            else if (platform.includes("linkedin")) platform = "linkedin";
            else if (platform.includes("facebook")) platform = "facebook";
            else if (platform.includes("whatsapp")) platform = "whatsapp";
            else if (platform.includes("website")) platform = "website";
            else platform = "instagram";
            const lang = (post.language || brain?.primaryLanguage || "english").toLowerCase() as any;
            const saved = await prisma.generatedAsset.create({
              data: {
                userId: userId!,
                type: "post",
                platform,
                language: lang,
                title: post.title || "Repurposed from URL",
                body: post.body,
                tags: Array.isArray(post.tags) ? post.tags : [],
                cta: post.cta || null,
                notes: post.notes || null,
                imagePrompt: post.imagePrompt || null,
                qualityScore: post.qualityScore || null,
              },
            });
            post.assetId = saved.id;
          } catch (saveErr) {
            console.error("[E6_URL_SAVE_ERROR]", saveErr);
          }
        })
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[REPURPOSE_URL_ERROR]", error);
    return NextResponse.json({ error: "Repurposing failed: " + error.message }, { status: 500 });
  }
}
