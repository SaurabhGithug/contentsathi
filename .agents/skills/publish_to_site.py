#!/usr/bin/env python3
"""
Skill: Publish to ContentSathi API
Hunter Agent — ContentSathi

Allows the agent to trigger publishing of a post directly via the ContentSathi API.
Called by the orchestrator when a battle card or auto-generated post is approved (or triggered).

Usage:
  python publish_to_site.py "<title>" "<content>" "<platform>" [image_path]
"""

import requests
import sys
import json
import os

CONTENTSATHI_API_BASE = os.getenv("CONTENTSATHI_API_URL", "http://localhost:3001")
API_KEY = os.getenv("CONTENTSATHI_API_KEY", "")


def post_to_contentsathi(title: str, content: str, platform: str, image_path: str = "") -> dict:
    """Post content to ContentSathi via the internal API."""
    url = f"{CONTENTSATHI_API_BASE}/api/generated-assets"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
        "x-cron-user-id": os.getenv("CONTENTSATHI_USER_ID", "")
    }
    payload = {
        "title": title,
        "body": content,
        "platform": platform,
        "imageUrl": image_path,
        "type": "social_post",
        "status": "ready",
        "source": "hunter_agent"
    }
    
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=15)
        r.raise_for_status()
        return {"success": True, "status_code": r.status_code, "data": r.json()}
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": str(e)}


def send_whatsapp_alert(message: str, phone: str) -> dict:
    """Trigger a WhatsApp notification via ContentSathi webhook."""
    url = f"{CONTENTSATHI_API_BASE}/api/webhook/whatsapp-notify"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    payload = {"to": phone, "message": message}
    
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=10)
        return {"success": True, "status_code": r.status_code}
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({
            "error": "Usage: python publish_to_site.py <title> <content> <platform> [image_path]"
        }))
        sys.exit(1)
    
    title = sys.argv[1]
    content = sys.argv[2]
    platform = sys.argv[3]
    image_path = sys.argv[4] if len(sys.argv) > 4 else ""
    
    result = post_to_contentsathi(title, content, platform, image_path)
    print(json.dumps(result, indent=2))
    sys.exit(0 if result.get("success") else 1)
