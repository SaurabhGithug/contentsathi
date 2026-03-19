/**
 * Sarvam AI Utility
 * Handles transcreation of content into 10 Indian regional languages.
 * Powered by Sarvam-M model.
 * Also provides Two-Pass generation for Freemium users (Think → Write).
 */

const SARVAM_API_BASE = "https://api.sarvam.ai";
const SARVAM_CHAT_URL = `${SARVAM_API_BASE}/v1/chat/completions`;
const SARVAM_MODEL = "sarvam-m";

// ── Two-Pass Sarvam Functions (Freemium Engine) ────────────────────────────

/**
 * Pass 1 — Thinker: Calls Sarvam-M with reasoning enabled to analyze the
 * topic and return structured JSON (audience, pain points, emotional angle, etc.)
 */
export async function callSarvamJSON(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 1500
): Promise<any> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) throw new Error("SARVAM_API_KEY is not configured.");

  const response = await fetch(SARVAM_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": apiKey,
    },
    body: JSON.stringify({
      model: SARVAM_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: maxTokens,
      reasoning_effort: "medium", // Enable thinking mode for analysis
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Sarvam API Error (JSON): ${response.status} — ${err.substring(0, 200)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from Sarvam (JSON)");

  try {
    // Strip <think> reasoning tags which can break JSON parse
    let cleanText = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    // Also strip unclosed think tags just to be safe
    cleanText = cleanText.replace(/<think>[\s\S]*/gi, "").trim();

    const clean = cleanText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(clean);
  } catch {
    // Try to extract JSON from anywhere in the response
    let cleanText = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    cleanText = cleanText.replace(/<think>[\s\S]*/gi, "").trim();

    const match = cleanText.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    
    console.error("Sarvam failed to return valid JSON. Raw text:", text.substring(0, 300));
    const fs = require('fs');
    fs.appendFileSync('/tmp/sarvam_raw.txt', '\n\n---\n\n' + text);
    throw new Error("Sarvam returned invalid JSON");
  }
}

/**
 * Pass 2 — Writer: Calls Sarvam-M in non-think mode to write the final
 * platform content using the master 6-technique prompt.
 */
export async function callSarvamChat(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 600
): Promise<string> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) throw new Error("SARVAM_API_KEY is not configured.");

  const response = await fetch(SARVAM_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": apiKey,
    },
    body: JSON.stringify({
      model: SARVAM_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: maxTokens,
      // No reasoning_effort = non-think mode for efficient writing
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Sarvam API Error (Chat): ${response.status} — ${err.substring(0, 200)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from Sarvam (Chat)");
  
  // Clean up any leaked reasoning blocks
  let cleanText = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // If an unclosed tag remains at the start, just strip the tag itself to keep the actual content
  cleanText = cleanText.replace(/<think>/gi, "").trim();

  return cleanText;
}

// ── Free Tier Constants ─────────────────────────────────────────────────────

export const FREE_TIER_PLATFORMS = ["Instagram", "WhatsApp"];
export const FREE_TIER_LANGUAGES = ["English", "Hindi", "Marathi"];
export const FREE_TIER_MONTHLY_LIMIT = 30;

// ── Pass 1 Prompt: Thinker ──────────────────────────────────────────────────

export function buildThinkerSystemPrompt(): string {
  return `You are a real estate market expert specializing in Indian Tier-2 cities, especially Nagpur, Pune, Indore, Lucknow, Jaipur, and surrounding areas.

You deeply understand Indian homebuyers — their fears (builder delays, unclear titles, black money), their aspirations (first own home, investment for children), and their decision-making process.

Analyze the user's topic and return a structured JSON with these EXACT keys:
{
  "targetAudience": "string — the most likely buyer persona",
  "topPainPoints": ["string", "string", "string"],
  "bestEmotionalAngle": "string — the most powerful emotional trigger for this audience",
  "localReference": "string — one specific local reference (road, area, landmark, infrastructure project) relevant to the city mentioned or a general Indian real estate reference",
  "trustSignal": "string — one fact or credential that builds instant trust (e.g. RERA number, years in market, possession status)",
  "urgencyTrigger": "string — why the buyer should act NOW, not later"
}

Return ONLY valid JSON. No markdown, no explanation.`;
}

// ── Pass 2 Prompt: Writer (Master 6-Technique Prompt) ─────────────────────

export function buildWriterSystemPrompt(
  platform: string,
  language: string,
  thinkingResults: any,
  brainContext: string,
  tone: string,
): string {
  const platformRules = getFreeTierPlatformRules(platform);
  const langInstruction = getLanguageInstruction(language);

  return `ROLE: You are Ravi, a top-performing real estate content creator in India with 12 years of experience. You know every locality, every buyer objection, every emotional trigger that makes Indian families act on property decisions. You speak naturally in ${language === "Hindi" ? "Hinglish (mix of Hindi and English as urban Indians speak)" : language === "Marathi" ? "casual Marathi as spoken in Nagpur/Vidarbha region" : "clear, engaging English"}. You NEVER use generic phrases like "in today's world" or "as we all know". Every post you write has one specific local detail.

CONTEXT (use this knowledge when generating):
- Indian home buyers' top 3 fears: builder delays, unclear titles, hidden charges
- RERA approval is the #1 trust signal for Indian buyers in 2025
- Tier 2 cities like Nagpur have 15-20% appreciation annually near Ring Road and MIHAN corridor
- Festival season (Oct-Nov) sees 35% spike in property enquiries
- WhatsApp is primary communication channel for Nagpur agents
- Average buyer in Nagpur takes 3-6 months to decide
- "Vastu compliant" is important to 70% of Nagpur buyers
- EMI affordability and bank loan pre-approval are key decision accelerators

ANALYSIS FROM RESEARCH (use this directly):
- Target Audience: ${thinkingResults.targetAudience || "First-time homebuyers"}
- Their Pain Points: ${(thinkingResults.topPainPoints || []).join(", ")}
- Best Emotional Angle: ${thinkingResults.bestEmotionalAngle || "Aspiration"}
- Local Reference to Use: ${thinkingResults.localReference || "Prime location"}
- Trust Signal: ${thinkingResults.trustSignal || "RERA approved project"}
- Urgency Trigger: ${thinkingResults.urgencyTrigger || "Limited units available"}

${brainContext ? `BRAND INFO: ${brainContext}` : ""}

EXAMPLE OF A GREAT ${platform.toUpperCase()} POST:
${getExamplePost(platform, language)}

PLATFORM RULES: ${platformRules}

${langInstruction}

TASK — Think through these steps before writing (write your reasoning for each):
Step 1: Who exactly is reading this and what keeps them up at night about buying property?
Step 2: What is the ONE emotion that will make them stop scrolling?
Step 3: What specific local detail (area/road/project) makes this feel real, not generic?
Step 4: What CTA will make them act TODAY, not "someday"?

Now using your reasoning above, fill this template:

HOOK (first line, must create curiosity or urgency): ___
LOCAL REFERENCE (specific road/area/landmark): ___
3 BENEFITS (one line each):
  1. ___
  2. ___
  3. ___
OBJECTION CRUSHER (one line addressing the main doubt): ___
CTA (action-oriented, under 10 words): ___
HASHTAGS (5, mix of English and ${language !== "English" ? language : "Hindi"}): ___

SELF-REVIEW before submitting:
- Does the first line create curiosity? If not, rewrite it.
- Is there a specific local reference? If not, add one.
- Is the CTA clear and urgent? If not, strengthen it.
- Are there any generic phrases like "in today's world"? Remove them.
- Does it sound like a real person wrote this, not an AI? Fix anything robotic.

FINAL OUTPUT: Write ONLY the final ${platform} post. No template labels, no step numbers, no reasoning — just the ready-to-post content in ${language}. Tone: ${tone}.`;
}

function getFreeTierPlatformRules(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes("instagram")) return "Instagram: Punchy 2-line hook that stops the scroll. 3 compelling value bullets with natural emojis. Clear, urgent CTA. 5 hashtags mixing English and relevant language. Total 150-200 words.";
  if (p.includes("whatsapp")) return "WhatsApp Broadcast: Warm personal greeting. 3 value lines with emojis. One specific number or fact. One open-ended question to start conversation. Property inquiry CTA. Keep under 120 words. Sound like a message from a trusted friend, not a brand.";
  return "Social Media: Engaging hook. 3 value points. Clear CTA.";
}

function getLanguageInstruction(language: string): string {
  if (language === "Hindi") return `CRITICAL LANGUAGE INSTRUCTION: This is not a translation task. Do not translate the English content word by word. You must completely reimagine and rewrite the content the way a real estate agent in Nagpur actually speaks to a buyer on WhatsApp or in person. Write in natural Hinglish — mix Hindi and English words the way urban Indians in Tier 2 cities actually speak. Use phrases like Sach mein batao toh, Ekdum sahi jagah hai, Bilkul first class location hai, Seedha point pe aata hoon, Yaar sun, Kya lagta hai aapko. Never use formal bookish Hindi. Never say Pratham for first. Never say Ucch Prasansa for high appreciation. Never say Pratispardhi for competitive. Say Pehla, Bahut tagda, Saste mein best deal. The reader must feel a real human from Nagpur wrote this, not a translation engine.`;
  if (language === "Marathi") return `CRITICAL LANGUAGE INSTRUCTION: This is not a translation task. Do not translate the English content word by word. You must completely reimagine and rewrite the content the way a real estate agent in Nagpur and the Vidarbha region speaks to a local buyer. Write in casual Vidarbha-style Marathi — not formal Pune Marathi. Mix Marathi and English naturally. Use expressions like Ekdum mast ahe, Changli jagah ahe bhai, Ghya na contact, Ata ch bagh, Khup changlya price la milte, Serious asayla phone kar. Never use formal literary Marathi. Never use words that sound like a textbook. The reader must feel a trusted local Nagpur person wrote this, not software.`;
  return "LANGUAGE: Write in clear, engaging English. Use simple words that a Tier-2 city buyer would understand.";
}

function getExamplePost(platform: string, language: string): string {
  const p = platform.toLowerCase();
  if (p.includes("instagram") && language === "Hindi") {
    return `Wardha Road pe apna ghar banana chahte ho? 🏠

Naye 2BHK flats available hain — ready possession,
RERA approved, aur nearest school 5 min mein.

✅ Bank loan 90% tak approved
✅ Vastu compliant design
✅ 24/7 security + parking

Kya aapko pata hai? Is area mein prices last 2 saal mein 18% badhe hain. Aur abhi bhi affordable hai compared to Dharampeth ya Sitabuldi.

Abhi enquiry karo — limited units bacha hain.
📞 Call karo: [number]

#NagpurRealEstate #WardhaRoad #2BHKFlats #GharKhojo #प्रॉपर्टी`;
  }
  if (p.includes("instagram") && language === "Marathi") {
    return `वर्धा रोडवर स्वतःचं घर हवंय? 🏠

नवीन 2BHK फ्लॅट्स उपलब्ध — रेडी पॉसेशन,
RERA मंजूर, आणि जवळचं शाळा फक्त 5 मिनिटांवर.

✅ बँक लोन 90% पर्यंत
✅ वास्तू अनुसार डिझाइन
✅ 24/7 सुरक्षा + पार्किंग

आत्ताच चौकशी करा — मर्यादित युनिट्स शिल्लक.
📞 कॉल करा: [number]

#नागपूररिअलइस्टेट #WardhaRoad #GharKhojo`;
  }
  if (p.includes("whatsapp")) {
    return `🙏 Namaste!

Kya aap Nagpur mein plot ya flat dhundh rahe hain?

Humne ek naya project launch kiya hai Wardha Road pe:
✅ RERA registered
✅ Starting ₹28 lakh se
✅ 5 min se school, hospital, highway

Aaj hi site visit book karein — koi obligation nahi.

Kya aapko interest hai? Reply karein "HAAN" 👇`;
  }
  // Default English Instagram
  return `Your dream home near MIHAN is now a reality 🏠

New 2BHK flats on Wardha Road — ready to move in.

✅ RERA Approved — No risk
✅ 90% Bank Loan Available
✅ School, Hospital, Highway — all within 5 mins

Prices in this corridor jumped 18% in 2 years.
Early buyers locked the best deals.

📞 Call now for a free site visit: [number]

#NagpurRealEstate #MIHANCorridor #HomeBuyers #Investment #PropertyDeals`;
}


export const SARVAM_LANGUAGE_CONFIGS: Record<string, { code: string; nativeScript: string; dialectInstruction: string }> = {
  Hindi: {
    code: "hi-IN",
    nativeScript: "हिन्दी",
    dialectInstruction: `Write in natural Hinglish as spoken by urban Indians. Mix Hindi and English as people actually speak in cities.`,
  },
  Marathi: {
    code: "mr-IN",
    nativeScript: "मराठी",
    dialectInstruction: `Write in casual Marathi as spoken in the Vidarbha region, specifically Nagpur.`,
  },
  Tamil: {
    code: "ta-IN",
    nativeScript: "தமிழ்",
    dialectInstruction: `Write in conversational Tamil as spoken in urban Tamil Nadu.`,
  },
  Telugu: {
    code: "te-IN",
    nativeScript: "తెలుగు",
    dialectInstruction: `Write in conversational Telugu as spoken in Hyderabad and Andhra Pradesh cities.`,
  },
  Kannada: {
    code: "kn-IN",
    nativeScript: "ಕನ್ನಡ",
    dialectInstruction: `Write in conversational Kannada as spoken in Bangalore and urban Karnataka.`,
  },
  Malayalam: {
    code: "ml-IN",
    nativeScript: "മലയാളം",
    dialectInstruction: `Write in conversational Malayalam as spoken in Kerala cities.`,
  },
  Bengali: {
    code: "bn-IN",
    nativeScript: "বাংলা",
    dialectInstruction: `Write in conversational Bengali as spoken in Kolkata and urban West Bengal.`,
  },
  Gujarati: {
    code: "gu-IN",
    nativeScript: "ગુજરાતી",
    dialectInstruction: `Write in conversational Gujarati as spoken by business-minded Gujarati communities.`,
  },
  Punjabi: {
    code: "pa-IN",
    nativeScript: "ਪੰਜਾਬੀ",
    dialectInstruction: `Write in conversational Punjabi as spoken in Punjab and Delhi NCR.`,
  },
  Odia: {
    code: "or-IN",
    nativeScript: "ଓଡ଼ିଆ",
    dialectInstruction: `Write in conversational Odia as spoken in Bhubaneswar and urban Odisha.`,
  },
};

export const ALL_LANGUAGES = ["English", ...Object.keys(SARVAM_LANGUAGE_CONFIGS)];
export const INDIC_LANGUAGES = Object.keys(SARVAM_LANGUAGE_CONFIGS);

const LANGUAGE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SARVAM_LANGUAGE_CONFIGS).map(([k, v]) => [k, v.code])
);

/**
 * Transcreates English text into a target Indian language using Sarvam AI.
 * Falls back to original text if API key is missing or request fails.
 */
export async function transcreateWithSarvam(
  text: string,
  targetLanguage: string,
  context?: string
): Promise<string> {
  const apiKey = process.env.SARVAM_API_KEY;
  const targetCode = LANGUAGE_MAP[targetLanguage];

  if (!apiKey || !targetCode) {
    console.warn(`[SARVAM] Skipping transcreation: ${!apiKey ? "Missing API Key" : "Unsupported language: " + targetLanguage}`);
    return text;
  }

  try {
    const response = await fetch(`${SARVAM_API_BASE}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        input: text,
        source_language_code: "en-IN",
        target_language_code: targetCode,
        speaker_gender: "Male", // Neutral/Professional tone
        mode: "formal",
        context: context || "Real estate social media post for an Indian audience. Maintain professional and engaging tone.",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.translated_text || text;
  } catch (error) {
    console.error(`[SARVAM_ERROR] Failed to transcreate to ${targetLanguage}:`, error);
    return text; // Fallback to English/Original
  }
}

// Alias for backward compatibility with existing route.ts
export const generateIndicContent = (text: string, lang: string, platform: string, topic: string) => 
  transcreateWithSarvam(text, lang, `Platform: ${platform}. Topic: ${topic}. Real estate context.`);

/**
 * Checks if a language is supported by Sarvam-M
 */
export function isSarvamSupported(language: string): boolean {
  return !!LANGUAGE_MAP[language];
}

export default SARVAM_LANGUAGE_CONFIGS;
