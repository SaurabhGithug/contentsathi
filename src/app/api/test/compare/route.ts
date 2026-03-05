import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";
import {
  callSarvamJSON, callSarvamChat,
  buildThinkerSystemPrompt, buildWriterSystemPrompt,
} from "@/lib/sarvam";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// ── Gemini Helpers (duplicated here for isolation) ─────────────────────────
async function callGeminiJSON(systemPrompt: string, userPrompt: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
      }),
    }
  );
  if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");
  const clean = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(clean);
}

async function callGeminiText(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85 },
      }),
    }
  );
  if (!response.ok) throw new Error(`Gemini Text Error: ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

function getPlatformRules(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes("instagram")) return "Instagram: Punchy 2-line hook. 3 value bullets. Natural emojis. Clear CTA. 5 hashtags.";
  if (p.includes("whatsapp")) return "WhatsApp: Warm greeting. 3 value lines. One open-ended question. Property inquiry CTA. Keep under 150 words.";
  return "Social Media: Engaging hook. 3 value points. Clear CTA.";
}

// ── Main POST Handler: Runs both engines in parallel ──────────────────────
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    topic: rawTopic,
    platform = "Instagram",
    language = "Hindi",
    tone = "Conversational",
  } = body;

  const topic = sanitizeText(rawTopic, 500);
  if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

  const audience = "First-time homebuyers, Investors";
  const brainContext = "Niche: Real Estate. City: Nagpur.";

  // Run both engines in parallel
  const [sarvamResult, geminiResult] = await Promise.allSettled([
    // ── Sarvam Two-Pass ──────────────────────────────────────────────
    (async () => {
      const startTime = Date.now();

      // Pass 1: Think
      let thinkingResults: any;
      try {
        thinkingResults = await callSarvamJSON(
          buildThinkerSystemPrompt(),
          `Topic: ${topic}\nAudience: ${audience}\nCity: Nagpur, India\nTone: ${tone}`
        );
      } catch (e: any) {
        thinkingResults = {
          targetAudience: "First-time homebuyers",
          topPainPoints: ["Builder trust", "Hidden costs", "Delayed possession"],
          bestEmotionalAngle: "Your family deserves their own home",
          localReference: "Ring Road corridor",
          trustSignal: "RERA registered",
          urgencyTrigger: "Prices rising — act now",
        };
      }

      // Pass 2: Write
      const writerSystem = buildWriterSystemPrompt(
        platform, language, thinkingResults, brainContext, tone
      );
      const content = await callSarvamChat(writerSystem, `Write a ${platform} post about: ${topic}`);

      return {
        engine: "Sarvam-M (Two-Pass)",
        content,
        thinkingResults,
        timeMs: Date.now() - startTime,
      };
    })(),

    // ── Gemini Full Pipeline ─────────────────────────────────────────
    (async () => {
      const startTime = Date.now();

      // Intent Analysis
      const intentSystem = `You are an expert Indian Real Estate Content Strategist. Analyze the user's request and return JSON:
{
  "primaryGoal": "awareness|lead_generation|trust_building|urgency",
  "targetAudience": "first_time_buyer|investor|nri|land_buyer|general",
  "emotionalTrigger": "FOMO|aspiration|trust|urgency|security",
  "contentAngle": "string",
  "cityContext": "string or null",
  "projectName": "string or null"
}`;
      const intentUser = `Topic: ${topic}\nAudience: ${audience}\nPlatform: ${platform}\nLanguage: ${language}`;

      let intentJson: any;
      try {
        intentJson = await callGeminiJSON(intentSystem, intentUser);
      } catch {
        intentJson = { primaryGoal: "awareness", targetAudience: "general", emotionalTrigger: "aspiration", contentAngle: "informative", cityContext: "Nagpur", projectName: null };
      }

      // Research
      const researchSystem = `You are a Real Estate Research Agent. Return JSON:
{
  "talkingPoints": ["string","string","string"],
  "objectionHandlers": [{"objection":"string","response":"string"}],
  "localReferences": ["string","string"],
  "emotionalHook": "string",
  "marketContext": "string"
}`;
      const researchUser = `Topic: ${topic}\nIntent: ${JSON.stringify(intentJson)}\nCity: ${intentJson.cityContext || "Nagpur"}`;

      let researchJson: any;
      try {
        researchJson = await callGeminiJSON(researchSystem, researchUser);
      } catch {
        researchJson = { talkingPoints: [topic], objectionHandlers: [], localReferences: ["Nagpur"], emotionalHook: "Your dream home awaits.", marketContext: "2025 market." };
      }

      // Write
      const platformRules = getPlatformRules(platform);
      const writePrompt = `You are an elite social media copywriter for Indian real estate.
Platform: ${platform}
${platformRules}
Topic: ${topic}
Tone: ${tone}
Goal: ${intentJson.primaryGoal}
Target Audience: ${intentJson.targetAudience}
Emotional Hook: ${researchJson.emotionalHook}
Key Points: ${researchJson.talkingPoints?.join(", ")}
City: ${intentJson.cityContext || "India"}
Write the ${platform} post in ${language}:`;

      const content = await callGeminiText(writePrompt);

      return {
        engine: "Gemini 2.5 Flash (Full Pipeline)",
        content,
        thinkingResults: { intent: intentJson, research: researchJson },
        timeMs: Date.now() - startTime,
      };
    })(),
  ]);

  return NextResponse.json({
    topic,
    platform,
    language,
    tone,
    sarvam: sarvamResult.status === "fulfilled"
      ? sarvamResult.value
      : { engine: "Sarvam-M", error: (sarvamResult as PromiseRejectedResult).reason?.message || "Failed", content: null, timeMs: 0 },
    gemini: geminiResult.status === "fulfilled"
      ? geminiResult.value
      : { engine: "Gemini", error: (geminiResult as PromiseRejectedResult).reason?.message || "Failed", content: null, timeMs: 0 },
  });
}
