#!/usr/bin/env python3
"""
Skill: Competitor Scraper
Hunter Agent — ContentSathi
Scrapes 99acres, MagicBricks, Housing.com for new listings near Nagpur target corridors.
"""

import json
import sys
import datetime
import urllib.request
import urllib.parse
import re

TARGET_CORRIDORS = [
    "Wardha Road Nagpur",
    "Besa Nagpur",
    "Mihan Nagpur",
    "Ring Road Nagpur",
    "Hingna Road Nagpur",
    "Katol Road Nagpur"
]

def scrape_99acres(query: str) -> list[dict]:
    """Fetches search results from 99acres RSS-style endpoint."""
    results = []
    try:
        encoded = urllib.parse.quote(query)
        url = f"https://www.99acres.com/search/property/residential-sale-in-nagpur?keyword={encoded}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode("utf-8", errors="ignore")
        
        # Extract basic listing metadata via patterns
        prices = re.findall(r"₹\s*([\d,.]+\s*(?:Lac|Cr|Lakh))", html, re.IGNORECASE)
        titles = re.findall(r"<meta name=\"description\" content=\"([^\"]+)\"", html)
        locations = re.findall(r"in\s+([\w\s]+,\s*Nagpur)", html, re.IGNORECASE)
        
        for i, price in enumerate(prices[:5]):
            results.append({
                "source": "99acres",
                "query": query,
                "price": price.strip(),
                "title": titles[i] if i < len(titles) else f"Property near {query}",
                "location": locations[i] if i < len(locations) else query,
                "scraped_at": datetime.datetime.utcnow().isoformat()
            })
    except Exception as e:
        results.append({"source": "99acres", "query": query, "error": str(e)})
    return results


def scrape_magicbricks(query: str) -> list[dict]:
    """Fetches search results from MagicBricks for Nagpur."""
    results = []
    try:
        encoded = urllib.parse.quote(query)
        url = f"https://www.magicbricks.com/property-for-sale/residential-real-estate?proptype=Multistoreyed-Flat,Builder-Floor-Apartment,Penthouse&Locality={encoded}&City=Nagpur"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode("utf-8", errors="ignore")
        
        prices = re.findall(r"Rs\.?\s*([\d,.]+(?:\s*Lac|\s*Crore|\s*L)?)", html, re.IGNORECASE)
        titles = re.findall(r'"projectName":"([^"]+)"', html)
        
        for i, price in enumerate(prices[:5]):
            results.append({
                "source": "magicbricks",
                "query": query,
                "price": price.strip(),
                "title": titles[i] if i < len(titles) else f"Project near {query}",
                "location": query,
                "scraped_at": datetime.datetime.utcnow().isoformat()
            })
    except Exception as e:
        results.append({"source": "magicbricks", "query": query, "error": str(e)})
    return results


def analyze_competitor_gaps(listings: list[dict]) -> dict:
    """
    Analyzes scraped data to find the 'content gap'.
    Returns a gap analysis object.
    """
    all_text = " ".join([
        f"{l.get('title','')} {l.get('location','')} {l.get('price','')}"
        for l in listings
    ]).lower()
    
    # Detect what competitors focus on
    topics_found = []
    if "price" in all_text or "₹" in all_text or "lac" in all_text:
        topics_found.append("price")
    if "rera" in all_text:
        topics_found.append("rera")
    if "school" in all_text or "hospital" in all_text:
        topics_found.append("infrastructure")
    if "possession" in all_text or "ready" in all_text:
        topics_found.append("possession_status")
    if "vastu" in all_text:
        topics_found.append("vastu")

    # Identify gaps
    all_topics = ["price", "rera", "infrastructure", "possession_status", "vastu", "investment_roi", "nri_appeal"]
    gaps = [t for t in all_topics if t not in topics_found]
    
    return {
        "competitor_focus": topics_found,
        "content_gaps": gaps,
        "recommendation": f"Your next post should focus on: {', '.join(gaps[:2])} — competitors are not covering this.",
        "total_listings_found": len([l for l in listings if "error" not in l]),
        "analyzed_at": datetime.datetime.utcnow().isoformat()
    }


def run_full_scan() -> dict:
    """Run full competitor scan across all corridors."""
    all_listings = []
    for corridor in TARGET_CORRIDORS:
        all_listings.extend(scrape_99acres(corridor))
        all_listings.extend(scrape_magicbricks(corridor))
    
    gap_analysis = analyze_competitor_gaps(all_listings)
    
    output = {
        "scan_time": datetime.datetime.utcnow().isoformat(),
        "corridors_scanned": TARGET_CORRIDORS,
        "listings_found": all_listings,
        "gap_analysis": gap_analysis
    }
    return output


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "full"
    
    if mode == "full":
        result = run_full_scan()
    elif mode == "corridor" and len(sys.argv) > 2:
        corridor = sys.argv[2]
        listings = scrape_99acres(corridor) + scrape_magicbricks(corridor)
        result = {
            "scan_time": datetime.datetime.utcnow().isoformat(),
            "corridor": corridor,
            "listings": listings,
            "gap_analysis": analyze_competitor_gaps(listings)
        }
    else:
        result = {"error": "Usage: python competitor_scraper.py [full|corridor <query>]"}
    
    print(json.dumps(result, indent=2))
