// ──────────────────────────────────────────────────────────────────────────
// Contentsathi - AI Prompt Templates (v2 — High Quality)
// ──────────────────────────────────────────────────────────────────────────

// ── Expert System Prompt ─────────────────────────────────────────────────

export const SYSTEM_PROMPT_BASE = `
You are an expert Indian content strategist and copywriter who specializes in creating high-converting social media content for solopreneurs, real estate developers, and small business owners in India. You understand Indian audiences deeply — their buying psychology, trust signals, cultural references, and language preferences including Marathi, Hindi, English, and Hinglish. You write content that feels human, warm, and credible — never robotic or salesy. You understand what hooks attention on Instagram Reels, what performs on LinkedIn for Indian professionals, and what converts on WhatsApp broadcasts for real estate buyers.

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

**Marathi content**: Use conversational Marathi spoken in Nagpur or Pune. Avoid Sanskrit-heavy or bookish words. Write as you'd speak.

**Hindi content**: Use simple, friendly, modern Bollywood-style Hindi mixed with English terms for clarity. E.g., "Yaar, suno — property prices badhne wale hain."

**Hinglish content**: Mix naturally — key facts, prices, and CTAs in English; emotional and conversational parts in Hindi/Marathi.
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
  languages: string[];
  primaryLanguage: string;
  languageMixRule?: string;
  brandName?: string;
  brandVoice?: string;
  ctaList?: string[];
  contactInfo?: string;
  goldenExamples?: string;
  researchContext?: string;
}) {
  const {
    topic, niche, audience, platforms, languages,
    primaryLanguage, languageMixRule, brandName,
    brandVoice, ctaList, contactInfo, goldenExamples,
    researchContext,
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
- Languages: ${languages.join(", ")}
- Primary Language: ${primaryLanguage}
- Language Mix Rule: ${languageMixRule || "Match the platform and audience naturally"}

${goldenExamples ? `## Style Examples (imitate these)\n${goldenExamples}` : ""}

${researchContext ? `## YouTube Research Context
The following are insights from the top-performing YouTube videos about this topic. Use these real facts, angles, and arguments to make the content more specific, credible, and current. Where relevant, weave in these insights naturally:

${researchContext}
` : ""}
${CONTENT_QUALITY_RULES}

Generate at least 7 posts. Cover all selected platforms. Generate at least one post per language where relevant.
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
Create the following from the source content:
1. **Instagram Caption** — Hinglish. Hook first (max 10 words). Emojis. Tags.
2. **LinkedIn Post** — Professional English. First-person opening. Short paragraphs. Insight-driven.
3. **WhatsApp Broadcast** — Natural conversational Hindi or Marathi. End with "Reply INTERESTED" or a specific contact CTA.
4. **YouTube Shorts Script** — Full verbatim script in Hinglish. Hook → Problem → Solution → CTA structure.
5. **Instagram Carousel Outline** — 5 slides with headline, body text, and visual suggestion per slide.
6. **Blog Outline** — SEO-optimized title + 4-5 section titles.

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
