#!/usr/bin/env python3
"""
Skill: Trend Analyzer
Hunter Agent — ContentSathi

Feeds scraped competitor data into Sarvam AI (or Gemini) to:
1. Identify "content gaps"
2. Determine win strategy (what YOUR content should focus on)
3. Generate a "Battle Card" post for the identified gap

Usage:
  python trend_analyzer.py <market_data_json_path>
"""

import sys
import json
import os
import urllib.request
import urllib.parse
import datetime

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")
SARVAM_CHAT_URL = "https://api.sarvam.ai/v1/chat/completions"


def analyze_with_sarvam(competitor_data: dict, brand_context: str = "") -> dict:
    """
    Passes competitor data into Sarvam-M and asks it to:
    - Identify dominant competitor strategies
    - Find 3 content gaps
    - Draft a battle card post in Hinglish
    """

    market_summary = json.dumps({
        "competitor_focus": competitor_data.get("gap_analysis", {}).get("competitor_focus", []),
        "content_gaps": competitor_data.get("gap_analysis", {}).get("content_gaps", []),
        "total_listings": competitor_data.get("gap_analysis", {}).get("total_listings_found", 0),
        "recommendation": competitor_data.get("gap_analysis", {}).get("recommendation", "")
    }, indent=2)

    payload = {
        "model": "sarvam-m",
        "messages": [
            {
                "role": "system",
                "content": f"""You are the Lead Content Strategist for a Nagpur real estate brand.
Your mission: analyze competitor market data and identify winning content strategies for the Nagpur real estate market.

Brand Context: {brand_context or "Premium real estate developer — RERA-approved plots and flats in Nagpur."}

Rules:
1. If competitors only talk about price → YOU talk about RERA compliance, infrastructure, future appreciation
2. Always use local Nagpur references: Ring Road, MIHAN, Wardha Road, Besa, Itwari, Poha, airport
3. Speak in Hinglish (natural conversational Indian mix)
4. Every post must have a WhatsApp CTA

Return this exact JSON:
{{
  "gap_found": "string — the main content gap you found",  
  "win_strategy": "string — your counter strategy in one sentence",
  "battle_card_post": "string — full ready-to-post Hinglish post (150 words max, with emojis, CTA)",
  "battle_card_marathi": "string — same post in casual Nagpur Marathi",
  "whatsapp_alert": "string — short 40-word WhatsApp alert to send to agent owner",
  "confidence_score": number
}}

Return only valid JSON. No explanation."""
            },
            {
                "role": "user",
                "content": f"Competitor Market Data: {market_summary}\nDraft the battle card post and strategy now."
            }
        ],
        "temperature": 0.75,
        "max_tokens": 900,
        "reasoning_effort": "medium"
    }

    try:
        req_body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            SARVAM_CHAT_URL,
            data=req_body,
            headers={
                "Content-Type": "application/json",
                "api-subscription-key": SARVAM_API_KEY
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            response = json.loads(r.read().decode("utf-8"))
        
        content_text = response.get("choices", [{}])[0].get("message", {}).get("content", "{}")
        # Clean any markdown formatting
        clean = content_text.replace("```json", "").replace("```", "").strip()
        result = json.loads(clean)
        result["analyzed_at"] = datetime.datetime.utcnow().isoformat()
        return result

    except Exception as e:
        return {
            "error": str(e),
            "gap_found": "Unable to analyze — using fallback",
            "win_strategy": "Post about RERA compliance and infrastructure as competitors focus on pricing",
            "battle_card_post": "🏠 Wardha Road pe aapka dream home — RERA approved! Competitors sirf price bata rahe hain, hum aapko transparency dete hain. Koi hidden charges nahi. Site visit ke liye call karen!",
            "whatsapp_alert": "Hunter Agent: Competitor activity detected on Wardha Road. Battle card ready — check dashboard.",
            "analyzed_at": datetime.datetime.utcnow().isoformat()
        }


def run(data_path: str, brand_context: str = "") -> dict:
    try:
        with open(data_path, "r") as f:
            market_data = json.load(f)
    except Exception as e:
        return {"error": f"Cannot read market data: {e}"}
    
    return analyze_with_sarvam(market_data, brand_context)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python trend_analyzer.py <market_data.json> [brand_context]"}))
        sys.exit(1)
    
    data_path = sys.argv[1]
    brand_ctx = sys.argv[2] if len(sys.argv) > 2 else ""
    result = run(data_path, brand_ctx)
    print(json.dumps(result, indent=2))
