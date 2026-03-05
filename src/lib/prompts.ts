// ──────────────────────────────────────────────────────────────────────────
// ContentSathi - AI Prompt Templates (v3 — High Quality)
// ──────────────────────────────────────────────────────────────────────────

// ── Expert System Prompt ─────────────────────────────────────────────────

export const SYSTEM_PROMPT_BASE = `
You are ContentSathi, an expert content strategist for Indian real estate professionals, especially those working in Tier-2 cities like Nagpur, Pune, and Mumbai. Your content is persuasive, culturally relevant, and uses local references. Always write in a conversational tone that builds trust.

For real estate content: mention specific benefits like RERA compliance, vastu, connectivity, investment returns, BHK configurations, carpet area, and locality names. Use price anchoring (₹ per sqft comparisons) and urgency naturally.

For Hindi/Marathi content: use natural spoken language, not formal/bookish. Marathi should sound like Nagpur or Pune locals speak, not like a news bulletin. Hindi should be modern conversational, not formal Shuddh Hindi.

Avoid generic phrases like "in today's world", "as we all know", "needless to say", "in conclusion", or "I'm happy to share". These are weak openers that kill engagement.

Every piece of content MUST have:
1. A strong HOOK in the first line (max 10 words — surprising fact, bold question, or relatable pain point)
2. VALUE in the middle (specific, credible details — not vague promises)
3. A clear, specific CTA at the end (not just "Contact us" — say exactly what to do)

Core rules you ALWAYS follow:
- Never create political, hateful, misleading, or illegal content.
- Always use ₹ for Indian currency.
- ALWAYS output valid JSON only — no extra text, no markdown fences, no explanation outside the JSON.
`.trim();


// ── Shared content quality rules injected into every user prompt ──────────

const CONTENT_QUALITY_RULES = `
## Content Quality Rules (follow strictly for every post)

**Instagram**: Start with a strong hook as the FIRST line. Hook must be max 10 words — a surprising fact, bold question, or relatable pain point. Do not start with the brand name or a greeting.

**LinkedIn**: Start with a strong first-person story or insight. Use line breaks every 1-2 sentences for scroll-friendly readability. No paragraphs of more than 2 sentences.

**WhatsApp**: Write like a message from a trusted friend, not an ad. Use ₹ for currency. End with a specific CTA like "Reply INTERESTED" or "Call/WhatsApp: [contact number]". Never sound corporate.

**YouTube Shorts Script**: Strictly follow this structure:
- Hook (0-3 sec): One punchy sentence to grab attention
- Problem (3-10 sec): The pain point or context that makes the viewer care
- Solution/Story (10-45 sec): The value, story, or reveal — write word-for-word, not bullet points
- CTA (45-60 sec): What the viewer should do right now
Target ~120 words total. Write exact words to say, not outlines.

**Real Estate content**:
- Always mention a real emotional benefit, not just features (e.g., "Your kids will grow up with a park at their doorstep" not just "park facing plots")
- Include price anchoring where relevant ("At ₹X per sqft, this is the last affordable option before rates jump")
- End with urgency: limited plots, RERA deadline, or price revision date

**Marathi content**: 
- Use conversational, warm Marathi spoken in Nagpur or Pune (e.g., using "tumhi" instead of "aapan" for friendly professional tone). 
- Avoid pure Sanskrit-heavy or news-reader words like "Prakalp" (use "Project" instead) or "Guntavnuk" (use "Investment"). 
- Marathi hook rule: Start with a relatable question like "Nagpur madhe plot ghyaycha vichar kartay?" (Thinking of buying a plot in Nagpur?)
- End with clear CTAs: "Aajch samparka sadha" or "Adhik mahiti sathi call kara".

**Hindi content**: 
- Use simple, friendly, modern conversational Hindi mixed naturally with English terms (like "Investment", "Location", "Returns", "Family") for clarity.
- Hindi hook rule: Start with a direct pain point or aspiration. E.g., "Kya aap bhi ek perfect ghar ki talash mein hain?" or "Real estate mein invest karne ka sahi waqt kab hai?"
- Do not use overly formal Hindi (avoid "Prastut hai", use "Pesh hai" or "Lekar aaye hain").

**Hinglish content**: 
- Mix naturally like a casual WhatsApp chat between friends or a modern Instagram Reel.
- Key facts, prices, features, and CTAs should be strictly in English.
- Emotional, conversational, and storytelling parts in Hindi/Marathi.
- Hook rule: Mashup of Hindi emotion + English fact. E.g., "Tired of paying high rent? Ab apna ghar lene ka sapna sach karein."
- Never write entire sentences in pure English followed by entire sentences in Hindi. Blend them within the same sentence.
`.trim();

// ── Shared output schema description ─────────────────────────────────────

const OUTPUT_SCHEMA = `
## Output Format
Return ONLY a valid JSON object exactly matching this schema (no extra keys, no markdown):
{
  "posts": [
    {
      "id": "unique_id",
      "platform": "instagram | linkedin | youtube_shorts | whatsapp | x | facebook",
      "language": "english | hindi | marathi | hinglish",
      "title": "short headline",
      "body": "full post text",
      "tags": ["tag1", "tag2"],
      "cta": "the specific call-to-action to add at the end",
      "notes": "1-2 sentences explaining why this format was chosen. IMPORTANT: If you used any specific facts or angles from the YOUTUBE RESEARCH CONTEXT, explicitly mention it here (e.g., 'Incorporated insights about [Topic] from researched YouTube videos.')"
    }
  ],
  "carouselOutline": [
    { "slideNumber": 1, "headline": "...", "bodyText": "...", "visualSuggestion": "..." }
  ],
  "shortsScript": {
    "hook": "exact words for 0-3 sec",
    "problem": "exact words for 3-10 sec",
    "solution": "exact words for 10-45 sec",
    "cta": "exact words for 45-60 sec",
    "totalWords": 120
  },
  "blogOutline": {
    "title": "SEO-optimized blog title",
    "sections": ["intro", "section_1_title", "section_2_title", "conclusion"]
  }
}
`.trim();

// ── Week-from-Topic Template ─────────────────────────────────────────────

export function buildWeekFromTopicPrompt(params: {
  topic: string;
  niche: string;
  audience: string;
  platforms: string[];
  languages?: string[];
  platformLanguages?: Record<string, string>;
  primaryLanguage: string;
  languageMixRule?: string;
  brandName?: string;
  brandVoice?: string;
  ctaList?: string[];
  contactInfo?: string;
  goldenExamples?: string;
  researchContext?: string;
  transliterateRoman?: boolean;
}) {
  const {
    topic, niche, audience, platforms, languages, platformLanguages,
    primaryLanguage, languageMixRule, brandName,
    brandVoice, ctaList, contactInfo, goldenExamples,
    researchContext, transliterateRoman,
  } = params;

  return `
Generate a full week (7 posts minimum) of high-quality, high-converting social media content for the following brief.

## Brand Brief
- Brand Name: ${brandName || "Not specified"}
- Niche: ${niche}
- Brand Voice: ${brandVoice || "Professional but warm and approachable"}
- Target Audience: ${audience}
- CTAs to use: ${ctaList?.join(", ") || "Contact us today"}
- Contact Info: ${contactInfo || ""}

## Content Brief
- Topic / Idea: ${topic}
- Platforms: ${platforms.join(", ")}
${platformLanguages ? `- Platform Languages: ${Object.entries(platformLanguages).map(([p, l]) => `${p}: ${l}`).join(", ")}` : `- Languages: ${languages?.join(", ")}`}
- Primary Language: ${primaryLanguage}
- Language Mix Rule: ${languageMixRule || "Match the platform and audience naturally"}

${goldenExamples ? `## Style Examples (imitate these)\n${goldenExamples}` : ""}

${researchContext ? `## YouTube Research Context
The following are insights from the top-performing YouTube videos about this topic. Use these real facts, angles, and arguments to make the content more specific, credible, and current. Where relevant, weave in these insights naturally:

${researchContext}
` : ""}
${CONTENT_QUALITY_RULES}
${transliterateRoman ? "\n**IMPORTANT TRANSLITERATION RULE**: You MUST output all Hindi and Marathi content strictly in the native Devanagari script (e.g., 'कसे आहात' or 'नमस्ते'). Do NOT use the Roman/English alphabet for Hindi or Marathi text." : ""}

Generate at least 7 posts. Cover all selected platforms.
${platformLanguages ? "IMPORTANT: strictly follow the exact language requested for each specific platform as listed in 'Platform Languages'. Do not use any other language for a platform." : "Generate at least one post per language where relevant."}
Include 5-slide carouselOutline for Instagram, a full shortsScript for YouTube, and a blogOutline.

${OUTPUT_SCHEMA}
`.trim();
}

// ── Repurpose-Source Template (Detailed) ───────────────────────────────────

export function buildRepurposeDetailedPrompt(params: {
  sourceContent: string;
  brandName?: string;
  brandVoice?: string;
  niche?: string;
  ctaList?: string[];
  contactInfo?: string;
}) {
  const { sourceContent, brandName, brandVoice, niche, ctaList, contactInfo } = params;

  return `
You are repurposing the provided source content into a comprehensive, high-converting multi-platform social media campaign for an Indian audience.

## Brand Context
- Brand Name: ${brandName || "Not specified"}
- Niche: ${niche || "General business / Real Estate"}
- Brand Voice: ${brandVoice || "Professional but warm and approachable"}
- CTAs: ${ctaList?.join(", ") || "Contact us today"}
- Contact Info: ${contactInfo || ""}

## Source Content
${sourceContent}

## Your Task
Produce posts for ALL of the following combinations. Each must be unique, platform-native, and language-accurate:

**Instagram Captions (3 posts)**
- 1 in English: strong hook, emojis, hashtags, CTA
- 1 in Hindi (Devanagari): hook + value + CTA, conversational tone
- 1 in Marathi (Devanagari): warm, Nagpur/Pune spoken Marathi

**LinkedIn Posts (3 posts)**
- 1 in English: first-person insight, short paragraphs, professional
- 1 in Hindi: modern conversational Hindi, professional tone
- 1 in Marathi: professional Marathi, short paragraphs

**WhatsApp Broadcasts (3 posts)**
- 1 in English: friendly, trust-building, ends with "Reply YES to learn more"
- 1 in Hindi: conversational like a message from a trusted friend, ends with "INTERESTED likhein"
- 1 in Marathi: warm Marathi, ends with "INTERESTED pathva" or "Aajch samparka sadha"

**X (Twitter) Threads (3 posts)**
- 1 in English: punchy opener, 3-tweet thread concept
- 1 in Hindi: viral-worthy hook, concise
- 1 in Marathi: short, punchy

**Facebook Posts (3 posts)**
- 1 in English: community-focused, longer text, relatable story
- 1 in Hindi: emotional storytelling angle
- 1 in Marathi: community connection angle

**YouTube Shorts Script (1 full script)**
- Language: Hinglish (Hindi + English blend)
- Structure: Hook (0-3s) → Problem (3-10s) → Solution (10-45s) → CTA (45-60s)
- ~120 words total, every word scripted

**Instagram Carousel Outline (5 slides)**
- Each slide: headline, bodyText, visualSuggestion

${CONTENT_QUALITY_RULES}

${OUTPUT_SCHEMA}
`.trim();
}


// ── Repurpose-Source Template (Basic) ────────────────────────────────────

export function buildRepurposeSourcePrompt(params: {
  sourceContent: string;
  platforms: string[];
  languages: string[];
  primaryLanguage: string;
  brandName?: string;
  brandVoice?: string;
  niche?: string;
  ctaList?: string[];
  generateBlog?: boolean;
  generateScript?: boolean;
  contactInfo?: string;
}) {
  const {
    sourceContent, platforms, languages, primaryLanguage,
    brandName, brandVoice, niche, ctaList,
    generateBlog, generateScript, contactInfo,
  } = params;

  return `
Repurpose the following source content into multiple high-quality social media formats for an Indian audience.

## Brand Context
- Brand Name: ${brandName || "Not specified"}
- Niche: ${niche || "General business"}
- Brand Voice: ${brandVoice || "Professional but warm and approachable"}
- CTAs: ${ctaList?.join(", ") || "Contact us today"}
- Contact Info: ${contactInfo || ""}

## Source Content
${sourceContent}

## Targets
- Platforms: ${platforms.join(", ")}
- Languages: ${languages.join(", ")}
- Primary Language: ${primaryLanguage}
- Generate Blog Article: ${generateBlog ? "Yes" : "No"}
- Generate Video Script: ${generateScript ? "Yes" : "No"}

${CONTENT_QUALITY_RULES}

Include at minimum 4 social posts. ${generateBlog ? "Include blogOutline." : ""} ${generateScript ? "Include full shortsScript." : ""}

${OUTPUT_SCHEMA}
`.trim();
}

// ── Real Estate Template Prompt ───────────────────────────────────────────

export function buildRealEstateTemplatePrompt(params: {
  templateCategory: string;
  projectName: string;
  location: string;
  startingPrice: string;
  usps: string;
  platforms: string[];
  languages: string[];
  primaryLanguage: string;
  brandName?: string;
  brandVoice?: string;
  ctaList?: string[];
  contactInfo?: string;
}) {
  const {
    templateCategory, projectName, location, startingPrice, usps,
    platforms, languages, primaryLanguage, brandName,
    brandVoice, ctaList, contactInfo,
  } = params;

  return `
Generate high-converting real estate social media content using the proven template type below and the property details provided.

## Template Type
${templateCategory}

## Brand Context
- Brand Name: ${brandName || "Not specified"}
- Brand Voice: ${brandVoice || "Professional but warm and approachable"}
- CTAs: ${ctaList?.join(", ") || "Book a site visit today!"}
- Contact: ${contactInfo || ""}

## Property Details
- Project / Property Name: ${projectName}
- Location: ${location}
- Starting Price: ${startingPrice}
- Key USPs: ${usps}

## Targets
- Platforms: ${platforms.join(", ")}
- Languages: ${languages.join(", ")}
- Primary Language: ${primaryLanguage}

${CONTENT_QUALITY_RULES}

Special instructions for this real estate content:
- Lead with the EMOTIONAL reason to buy (family security, status, peace of mind, children's future) before listing features.
- Use price anchoring: "At ₹X per sqft, this is still affordable compared to [nearby area] which is now ₹Y per sqft."
- Create urgency without lying: mention RERA registration deadline, limited unit count, or upcoming price revision if relevant.
- Use Indian real estate terminology naturally (BHK, sqft, per sqft rate, RERA approved, clear title, carpet area).
- Every WhatsApp post must end with a specific instruction: "Reply INTERESTED" or "Call/WhatsApp: [contact]".

Include posts for all selected platforms. Include a carouselOutline and shortsScript.

${OUTPUT_SCHEMA}
`.trim();
}
