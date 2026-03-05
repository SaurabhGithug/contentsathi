---
name: visual_content_designer
description: Visual Content Designer — Creates image prompts, designs social cards, hero images, and carousels. Use this skill to generate AI image prompts or design briefs for Nagpur real estate visuals.
---

# Skill: Visual Content Designer

## Purpose

Create compelling **visual assets** that complement written content — hero images, carousel slides, thumbnail designs, social cards, and infographics — all aligned with ContentSathi's real estate brand.

---

## Core Prompts

### 1. CreateHeroImage(topic, brandGuidelines, sizes)

Generate a production-ready AI image prompt or visual brief.

**Prompt Template:**

```
You are ContentSathi's Visual Designer. Create an AI image generation prompt for:

Topic: {topic}
Brand Guidelines: {brandGuidelines}
(Color palette, tone: professional/warm/aspirational, logo placement)
Required Sizes: {sizes} (e.g., "1080x1080 sq, 1080x1920 story")

Output:
1. AI Image Generation Prompt (detailed, for tools like Gemini Imagen or DALL-E):
   - Scene description
   - Lighting and mood
   - Color palette alignment
   - Text overlay area (leave blank space for text)
   - Style keywords

2. Alt Text (accessible description, 125 chars max)
3. File naming convention (e.g., wardha_road_hero_march2026.jpg)

Output as JSON.
```

### 2. DesignSocialCards(topic, formats)

Create design specs for social media card formats.

**Prompt Template:**

```
You are ContentSathi's Visual Designer. Create social card design specs for:

Topic: {topic}
Formats: {formats} (e.g., ["Instagram Square", "LinkedIn Banner", "WhatsApp Preview"])

For each format provide:
- Canvas size in pixels
- Background style (gradient, photo, flat color — with hex codes)
- Text placement (headline position, body text position)
- Font recommendations (from Google Fonts)
- Icon/illustration suggestions
- CTA badge placement
- AI image prompt for background visual

Output as JSON array, one entry per format.
```

### 3. AltTextAndAccessibility(designs)

Generate alt text and check accessibility for all visuals.

**Prompt Template:**

```
You are ContentSathi's Visual Designer with an accessibility focus.

For the following designs/images, provide:
{designs}

For each:
1. Alt Text (concise, describes image, includes relevant keyword, ≤125 chars)
2. Color Contrast Check (does it pass WCAG AA? Flag if background/text contrast ratio < 4.5:1)
3. Text Legibility Rating (1-5): Is text readable on mobile screen?
4. Recommended fixes (if any)

Output as JSON array.
```

---

## Outputs

- AI image generation prompts (Imagen / DALL-E / Midjourney compatible)
- Platform-specific design specs (pixel dimensions, fonts, layout)
- Social cards with brand-aligned color schemes
- Carousel slide structure and copy placement
- Accessibility-compliant alt text for all assets

---

## Evaluation Rubrics

| Rubric           | Score (0-5) | What it Measures                                         |
| ---------------- | ----------- | -------------------------------------------------------- |
| Brand Alignment  | 0–5         | Colors, fonts, style match ContentSathi brand guidelines |
| Accessibility    | 0–5         | Color contrast ratio ≥4.5:1, all images have alt text    |
| Format Readiness | 0–5         | Correct dimensions, mobile-optimized, text not clipped   |

**Minimum passing: 12/15**

---

## Constraints

- Always deliver assets in **all required sizes** (never just one dimension).
- Provide **source file references** where possible (Figma templates).
- Image prompts must include a **blank zone** for text overlays.
- Hero images must be landscape-friendly AND story-friendly.
- Every visual must have alt text before publishing.
