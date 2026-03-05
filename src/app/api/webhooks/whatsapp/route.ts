import { NextResponse } from "next/server";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/webhooks/whatsapp  — Webhook verification (Meta challenge)
// POST /api/webhooks/whatsapp  — Incoming delivery receipts / messages
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET — Meta's webhook verification handshake.
 * Meta sends: ?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE
 * We must respond with the challenge value if the verify token matches.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WHATSAPP_WEBHOOK] Verification successful");
    return new Response(challenge || "", { status: 200 });
  }

  console.warn("[WHATSAPP_WEBHOOK] Verification failed — token mismatch");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * POST — Incoming webhook events from Meta (WhatsApp Business API).
 * Handles: message delivery reports, read receipts, incoming messages.
 * Verifies X-Hub-Signature-256 before processing.
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    // ── 1. Verify signature ──────────────────────────────────────────────
    if (!appSecret) {
      console.error("[WHATSAPP_WEBHOOK] FACEBOOK_APP_SECRET not configured");
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    if (signature) {
      const expectedSig =
        "sha256=" +
        crypto
          .createHmac("sha256", appSecret)
          .update(rawBody)
          .digest("hex");

      if (signature !== expectedSig) {
        console.warn("[WHATSAPP_WEBHOOK] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    // ── 2. Parse payload ─────────────────────────────────────────────────
    const body = JSON.parse(rawBody);

    // Meta sends an array of entries → changes → statuses / messages
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;

        // ── Delivery status updates ────────────────────────────────────
        if (value?.statuses) {
          for (const status of value.statuses) {
            console.log(
              `[WHATSAPP_WEBHOOK] Message ${status.id} → ${status.status} (recipient: ${status.recipient_id})`
            );
            // Future: update delivery status in DB for WhatsApp sequences
          }
        }

        // ── Incoming messages ──────────────────────────────────────────
        if (value?.messages) {
          for (const msg of value.messages) {
            console.log(
              `[WHATSAPP_WEBHOOK] Incoming message from ${msg.from}: ${msg.type}`
            );
            // Future: handle incoming replies, auto-responses, lead capture
          }
        }
      }
    }

    // Always return 200 to acknowledge receipt (Meta re-sends on non-200)
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[WHATSAPP_WEBHOOK] Error:", error);
    // Still return 200 to prevent Meta retries on parse errors
    return NextResponse.json({ received: true });
  }
}
