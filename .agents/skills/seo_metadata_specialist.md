---
name: seo_metadata_specialist
description: SEO & Metadata Specialist — Optimizes content for search and discoverability. Use this skill to generate meta tags, heading structures, keyword plans, and internal link strategies for blog and website content.
---

# Skill: SEO & Metadata Specialist

## Purpose

Optimize ContentSathi's written content for **search engine discoverability** and **click-through performance** — ensuring blogs, website pages, and long-form content rank for Nagpur real estate queries.

---

## Core Prompts

### 1. SEOPlan(draft, keywords, audienceIntent)

Build a full SEO optimization plan for a given draft.

**Prompt Template:**

```
You are ContentSathi's SEO Specialist. Analyze this content and create an SEO plan:

DRAFT:
{draft}

TARGET KEYWORDS: {keywords}
AUDIENCE INTENT: {audienceIntent} (e.g., "informational", "transactional", "local")

Produce an SEO plan with:
1. Primary Keyword (exact match)
2. Secondary Keywords (2-3 LSI/related terms)
3. Recommended Title Tag (60 chars max)
4. Meta Description (155 chars max, include CTA)
5. H1 Recommendation
6. H2/H3 Structure
7. Keyword Density Check (flag if over-stuffed)
8. Featured Snippet opportunity (yes/no + type)

Output as JSON.
```

### 2. MetaAndHeadings(draft, keywords)

Generate optimized meta tags and heading hierarchy.

**Prompt Template:**

```
You are ContentSathi's SEO Specialist. Generate metadata and heading structure for:

DRAFT:
{draft}

KEYWORDS: {keywords}

Provide:
- Title Tag (≤60 chars, includes primary keyword near the start)
- Meta Description (≤155 chars, compelling, includes keyword + CTA)
- H1 (only one, keyword-rich)
- H2 list (3-5 subheadings covering main sections)
- H3 list (2-3 per H2 where appropriate)
- Alt text suggestions for any image placeholders

Output as JSON.
```

### 3. InternalLinkStrategy(topic, existingContent)

Plan internal links between ContentSathi content pieces.

**Prompt Template:**

```
You are ContentSathi's SEO Specialist. Design an internal linking strategy:

NEW CONTENT TOPIC: {topic}

EXISTING CONTENT LIBRARY:
{existingContent}

Identify:
1. Which existing pages should link TO this new content (and exact anchor text)
2. Which pages this content should link OUT TO (and exact anchor text)
3. Any orphan content that needs linking

Output as JSON with keys: inbound_links, outbound_links, orphan_pages.
```

---

## Outputs

- Keyword plans with intent mapping
- Optimized meta titles and descriptions
- Full heading structure (H1 → H3)
- Internal links plan with anchor text
- SEO-optimized draft markups

---

## Evaluation Rubrics

| Rubric             | Score (0-5) | What it Measures                                          |
| ------------------ | ----------- | --------------------------------------------------------- |
| Keyword Alignment  | 0–5         | Primary keyword in title, H1, first 100 words, meta desc  |
| Readability Impact | 0–5         | SEO additions don't break natural flow                    |
| Metadata Quality   | 0–5         | Title ≤60 chars, meta ≤155 chars, compelling CTA included |

**Minimum passing: 12/15**

---

## Constraints

- **Never keyword-stuff** — flag any keyword density above 2.5%.
- Maintain natural, human-readable language even after SEO optimization.
- Every blog/website post must have a unique meta title and description.
- Do not use exact match anchor text more than once per page.
