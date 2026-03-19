import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db/prisma";
import { PLANS, GST_RATE, type PlanTierKey } from "@/lib/utils/plans";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planTier, billingCycle } = await req.json();

    if (!planTier || !billingCycle) {
      return NextResponse.json(
        { error: "planTier and billingCycle are required" },
        { status: 400 }
      );
    }

    const plan = PLANS[planTier as PlanTierKey];
    if (!plan || planTier === "free") {
      return NextResponse.json(
        { error: "Invalid plan tier" },
        { status: 400 }
      );
    }

    const basePrice =
      billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
    const gstAmount = Math.round(basePrice * GST_RATE);
    const totalAmount = basePrice + gstAmount;

    // ── Razorpay key check ──────────────────────────────────────────────
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      // No Razorpay keys — return a mock order for development
      return NextResponse.json({
        orderId: `mock_order_${Date.now()}`,
        amount: totalAmount * 100, // Razorpay expects paise
        currency: "INR",
        keyId: "rzp_test_mock",
        planName: plan.name,
        billingCycle,
        basePrice,
        gstAmount,
        totalAmount,
        isMock: true,
        message:
          "Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env",
      });
    }

    // ── Create Razorpay order ───────────────────────────────────────────
    const receipt = `order_${token.sub}_${Date.now()}`;

    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " +
          Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
      },
      body: JSON.stringify({
        amount: totalAmount * 100, // paise
        currency: "INR",
        receipt,
        notes: {
          userId: token.sub,
          planTier,
          billingCycle,
        },
      }),
    });

    if (!orderRes.ok) {
      const err = await orderRes.json();
      console.error("Razorpay order creation failed:", err);
      return NextResponse.json(
        { error: "Failed to create payment order" },
        { status: 500 }
      );
    }

    const order = await orderRes.json();

    // Get user info for prefill
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { name: true, email: true, phone: true },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      planName: plan.name,
      billingCycle,
      basePrice,
      gstAmount,
      totalAmount,
      prefill: {
        name: user?.name || "",
        email: user?.email || "",
        contact: user?.phone || "",
      },
    });
  } catch (err: any) {
    console.error("Create order error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
