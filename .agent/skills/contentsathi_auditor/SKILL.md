---
name: ContentSathi Auditor
description: Audits the operational efficiency, autonomous intelligence level, and content quality of the ContentSathi platform.
---

# ContentSathi Auditor Skill

This skill provides a deep-dive audit of the ContentSathi engine. It evaluates how well the 7-Agent system is performing without human intervention and the balance between the volume of content generated versus its actual quality/relevance.

## Audit Parameters

1. **Autonomous Intelligence Level (AIL)**:
   - Percentage of tasks completed without agent failure or retry.
   - Effectiveness of the QC Auditor agent (rejections vs. approvals).
   - Usage of "Golden Examples" to self-heal content generation.

2. **Quality of Quantity (QoQ)**:
   - Average `qualityScore` across all `GeneratedAsset` records.
   - Platform-specific adherence (character limits, hashtag density, tone consistency).
   - Frequency of "filler content" detection.

3. **Data Freshness & Disruption Potential**:
   - Age of `MarketIntelligence` data utilized in generation.
   - Successful injection of "Live Signals" into final content.

## Usage

To run a full audit of the current system state, execute the following command in the terminal:

```bash
npx tsx .agent/skills/contentsathi_auditor/scripts/run_audit.ts
```

## Improvement Recommendations

The skill will output a "Disruption Score" and identify specific bottlenecks (e.g., "QC Agent is too lenient" or "LinkedIn research is stale").
