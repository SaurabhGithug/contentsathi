---
description: Full Content Campaign Workflow — Brief → Research → Write → SEO → Visuals → QC → Distribute
---

# Workflow: Content Campaign Pipeline

> Trigger: New content campaign request from user, OR when Generator fires a new batch of GeneratedAssets.

---

## Phase 1: Strategy (Content Lead)

1. Run `content_lead` skill → `CreateEditorialBrief(topic, audience, goals, tone, keywords, publishDate)`
   - Input: User's goal or content topic from `/api/generate`
   - Output: `brief.json` — structured content brief

2. Run `content_lead` skill → `BuildEditorialCalendar(baselineTopics, cadence, channels)`
   - Merge with festival calendar from database (`festival_calendar` table)
   - Output: Updated posting schedule in `calendar_items`

---

## Phase 2: Research (Research Specialist)

3. Run `research_specialist` skill → `GatherSources(topic, dateRange, requiredSources)`
   - Also trigger: `python .agents/skills/competitor_scraper.py full > memory/market_data.json`
   - Output: `research_notes.json` with annotated sources

4. Run `research_specialist` skill → `FactCheck(claims, sources)`
   - Cross-verify any statistics before writing begins.

---

## Phase 3: Writing (Content Writer)

5. Run `content_writer` skill → `WriteContent(brief, researchNotes, tone)`
   - Language and platform come from the `ContentBrain` schema.
   - Output: Raw draft in `generatedAssets` table (status: draft)

6. (Optional) Run `content_writer` skill → `ProduceVariants(brief, toneOptions, length)`
   - For A/B testing or multi-language campaigns.

---

## Phase 4: SEO (SEO Specialist)

7. Run `seo_metadata_specialist` skill → `SEOPlan(draft, keywords, audienceIntent)`
   - Only applies to blog/website content and LinkedIn articles
   - Output: Meta tags, heading structure, keyword density check

8. Run `seo_metadata_specialist` skill → `MetaAndHeadings(draft, keywords)`
   - Apply optimized headings to the draft before QC.

---

## Phase 5: Visuals (Visual Designer)

9. Run `visual_content_designer` skill → `CreateHeroImage(topic, brandGuidelines, sizes)`
   - Outputs AI image prompt → feed to Imagen API or send to designer
   - Store `imagePrompt` in `GeneratedAsset.imagePrompt`

10. Run `visual_content_designer` skill → `AltTextAndAccessibility(designs)`
    - Store alt text in asset metadata before publishing.

---

## Phase 6: Quality Gate (QC Auditor)

11. Run `quality_compliance_auditor` skill → `VerifyFacts(draft, sources)`
12. Run `quality_compliance_auditor` skill → `ComplianceAudit(draft, licenses, brandRules)`
    - If REVISION REQUIRED → loop back to Phase 3 with revision notes.
    - If COMPLIANT → update asset status to `ready`.

---

## Phase 7: Publish & Distribute (Distribution Specialist)

// turbo 13. Run `distribution_repurposing_specialist` skill → `DistributionPlan(content, channels, cadence)` - Merge plan into `calendar_items` table - Schedule via `/api/cron/publish-scheduled`

14. Run `distribution_repurposing_specialist` skill → `CreateSnippets(draft, platforms)`
    - Store per-platform variants as child `GeneratedAsset` records (parentAssetId)

// turbo 15. Publish to connected platforms via
`     POST /api/publish
    Body: { assetId, platform, scheduledAt }
    `

---

## Phase 8: Analytics Loop (Self-Improvement)

16. After 48 hours, fetch analytics:

    ```
    GET /api/analytics?source=campaign_pipeline&period=48h
    ```

17. Feed learnings to `content_lead` skill → update `memory/soul.md` with what worked.
    - "Marathi carousel posts → 2x saves vs single image"
    - "LinkedIn posts with investor angle → highest DM rate"

---

## Team Economics & Governance

| Role                    | Credits Consumed (est.) | Priority        |
| ----------------------- | ----------------------- | --------------- |
| Content Lead            | 5 credits/brief         | Highest         |
| Research Specialist     | 10 credits/scan         | High            |
| Content Writer          | 15 credits/draft        | High            |
| SEO Specialist          | 5 credits/plan          | Medium          |
| Visual Designer         | 8 credits/asset         | Medium          |
| QC Auditor              | 4 credits/review        | Critical (gate) |
| Distribution Specialist | 5 credits/plan          | Final step      |

**Total per campaign: ~52 credits**

### Escalation Rules

- If QC fails twice → notify owner via WhatsApp: "Content blocked. Manual review needed."
- If Research returns <3 sources → alert user and ask for topic refinement.
- If Competitor Scraper detects a viral post → immediately trigger Battle Card workflow (`/market_hunter.md`).
