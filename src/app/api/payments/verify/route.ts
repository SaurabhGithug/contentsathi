import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { PLANS, type PlanTierKey } from "@/lib/plans";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planTier,
      billingCycle,
    } = await req.json();

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !planTier ||
      !billingCycle
    ) {
      return NextResponse.json(
        { error: "Missing required payment fields" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // ── Mock mode (no Razorpay keys) ────────────────────────────────────
    if (!keySecret) {
      // Accept mock payments in development
      if (!razorpay_order_id.startsWith("mock_order_")) {
        return NextResponse.json(
          { error: "Razorpay not configured" },
          { status: 500 }
        );
      }
      // Activate plan directly for mock
      const plan = PLANS[planTier as PlanTierKey];
      if (!plan) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }
      const expiresAt = new Date();
      expiresAt.setMonth(
        expiresAt.getMonth() + (billingCycle === "yearly" ? 12 : 1)
      );

      await prisma.user.update({
        where: { id: token.sub },
        data: {
          planTier: planTier,
          planExpiresAt: expiresAt,
          creditsBalance: plan.monthlyCredits === -1 ? 999999 : plan.monthlyCredits,
        },
      });

      return NextResponse.json({
        success: true,
        newPlan: planTier,
        isMock: true,
        message: "Mock payment accepted. Plan activated.",
      });
    }

    // ── Verify Razorpay signature ───────────────────────────────────────
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      // Log fraud attempt
      console.error("Payment signature mismatch!", {
        userId: token.sub,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });

      await prisma.usageLog.create({
        data: {
          userId: token.sub,
          action: "payment_fraud_attempt",
          metadata: {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            ip: req.headers.get("x-forwarded-for") || "unknown",
          },
        },
      });

      return NextResponse.json(
        { success: false, error: "payment_verification_failed" },
        { status: 400 }
      );
    }

    // ── Signature valid — activate plan ──────────────────────────────────
    const plan = PLANS[planTier as PlanTierKey];
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(
      expiresAt.getMonth() + (billingCycle === "yearly" ? 12 : 1)
    );

    const gstAmount = Math.round(
      (billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly) * 0.18
    );
    const totalPaid =
      (billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly) +
      gstAmount;

    // Update user + create subscription in a transaction
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: token.sub },
        data: {
          planTier: planTier,
          planExpiresAt: expiresAt,
          creditsBalance:
            plan.monthlyCredits === -1 ? 999999 : plan.monthlyCredits,
        },
      }),
      prisma.subscription.create({
        data: {
          userId: token.sub,
          planTier: planTier,
          billingCycle: billingCycle,
          status: "active",
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          amountPaid: totalPaid,
          gstAmount,
          expiresAt,
        },
      }),
      prisma.usageLog.create({
        data: {
          userId: token.sub,
          action: "plan_upgrade",
          metadata: {
            planTier,
            billingCycle,
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            amount: totalPaid,
          },
        },
      }),
    ]);

    // TODO: Send upgrade confirmation email when email module is ready
    console.log(
      `[PAYMENT_VERIFY] Plan upgraded for ${updatedUser.email} → ${plan.name}`
    );

    return NextResponse.json({
      success: true,
      newPlan: planTier,
      credits: plan.monthlyCredits === -1 ? "Unlimited" : plan.monthlyCredits,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err: any) {
    console.error("Payment verify error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
