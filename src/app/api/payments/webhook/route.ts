import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { PLANS, type PlanTierKey } from "@/lib/plans";

// POST /api/payments/webhook
// Handles incoming Razorpay webhook events.
// Verifies HMAC-SHA256 signature before processing.

export async function POST(req: Request) {
  try {
    // ── 1. Read raw body for signature verification ────────────────────────
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[RAZORPAY_WEBHOOK] RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // ── 2. Verify HMAC-SHA256 signature ───────────────────────────────────
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("[RAZORPAY_WEBHOOK] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // ── 3. Parse event payload ────────────────────────────────────────────
    const event = JSON.parse(rawBody);
    const eventType: string = event.event;
    const payload = event.payload;

    console.log(`[RAZORPAY_WEBHOOK] Event: ${eventType}`);

    // ── 4. Handle events ──────────────────────────────────────────────────
    switch (eventType) {
      case "payment.captured": {
        const payment = payload.payment?.entity;
        if (!payment) break;

        const orderId = payment.order_id;
        const paymentId = payment.id;
        const amount = payment.amount; // in paise

        // Find subscription by Razorpay order ID
        const subscription = await prisma.subscription.findFirst({
          where: { razorpayOrderId: orderId },
        });

        if (subscription) {
          // Update subscription status
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: "active",
              razorpayPaymentId: paymentId,
              amountPaid: amount,
              startedAt: new Date(),
              expiresAt: new Date(
                Date.now() +
                  (subscription.billingCycle === "yearly"
                    ? 365 * 24 * 60 * 60 * 1000
                    : 30 * 24 * 60 * 60 * 1000)
              ),
            },
          });

          // Upgrade user plan using PLANS config
          const plan = PLANS[subscription.planTier as PlanTierKey];
          const credits = plan
            ? plan.monthlyCredits === -1 ? 999999 : plan.monthlyCredits
            : 100;

          await prisma.user.update({
            where: { id: subscription.userId },
            data: {
              planTier: subscription.planTier,
              planExpiresAt: new Date(
                Date.now() +
                  (subscription.billingCycle === "yearly"
                    ? 365 * 24 * 60 * 60 * 1000
                    : 30 * 24 * 60 * 60 * 1000)
              ),
              creditsBalance: credits,
            },
          });

          console.log(
            `[RAZORPAY_WEBHOOK] Payment captured for user ${subscription.userId}, plan: ${subscription.planTier}`
          );
        }
        break;
      }

      case "payment.failed": {
        const payment = payload.payment?.entity;
        if (!payment) break;

        const orderId = payment.order_id;

        const subscription = await prisma.subscription.findFirst({
          where: { razorpayOrderId: orderId },
        });

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "expired" },
          });

          console.log(
            `[RAZORPAY_WEBHOOK] Payment failed for order ${orderId}`
          );
        }
        break;
      }

      case "refund.created": {
        const refund = payload.refund?.entity;
        if (!refund) break;

        const paymentId = refund.payment_id;

        const subscription = await prisma.subscription.findFirst({
          where: { razorpayPaymentId: paymentId },
        });

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "cancelled", cancelledAt: new Date() },
          });

          // Downgrade user to free
          await prisma.user.update({
            where: { id: subscription.userId },
            data: {
              planTier: "free",
              creditsBalance: 100,
            },
          });

          console.log(
            `[RAZORPAY_WEBHOOK] Refund processed for user ${subscription.userId}`
          );
        }
        break;
      }

      default:
        console.log(`[RAZORPAY_WEBHOOK] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[RAZORPAY_WEBHOOK] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
