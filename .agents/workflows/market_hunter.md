---
description: Full Market Watch Cycle — Scrape → Analyze → Battle Card → WhatsApp Alert
---

# Workflow: Market Hunter Mission

> Trigger: Cron (every 6 hours) or WhatsApp command "Analyze [corridor] competitive landscape"

---

## Phase A: The Hunt (Intelligence)

// turbo

1. Run competitor scraper across all corridors

```
python .agents/skills/competitor_scraper.py full > memory/market_data.json
```

// turbo 2. Save scan timestamp to memory

```
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > memory/last_scan.txt
```

---

## Phase B: The Analysis (Strategy)

// turbo 3. Feed scraped data into Trend Analyzer (powered by Sarvam-M)

```
python .agents/skills/trend_analyzer.py memory/market_data.json > memory/battle_card.json
```

4. POST battle card to ContentSathi API for staging

```
POST /api/cron/market-watch
Body: battle_card.json contents
```

---

## Phase C: Alert & Stage

5. Send WhatsApp Alert to owner with summary
   - Triggered automatically by the `/api/cron/market-watch` endpoint
   - Message format: "🔍 Hunter found a gap: [gap_found]. Battle card drafted. Approve to post?"

6. Stage battle card in Content Library (status: draft)
   - Visible in dashboard under "Market Watch" tab
   - One-click publish available

---

## Phase D: Self-Improvement (Analytics Loop)

// turbo 7. After 48 hours, fetch post analytics

```
GET /api/analytics?source=hunter_agent&period=48h
```

8. Update `memory/soul.md` with new learnings
   - "Marathi posts on Wardha Road got X% more clicks"
   - "RERA-focused posts yielded Y more DMs"
   - These get injected into future content generation prompts

---

## WhatsApp Command Shortcuts

| Command               | Action                                       |
| --------------------- | -------------------------------------------- |
| "Analyze Wardha Road" | Runs scraper for Wardha Road only            |
| "Battle card Besa"    | Generates battle card for Besa corridor      |
| "Market watch now"    | Full scan across all corridors               |
| "What's working?"     | Returns top performing post analytics        |
| "Improve my strategy" | Runs self-improvement cycle, updates soul.md |
