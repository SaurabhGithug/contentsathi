import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { callSarvamJSON } from "@/lib/sarvam";

// PATCH /api/generated-assets/[id] — toggle isGoldenExample or update title/tags
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();

    // Verify ownership
    const asset = await prisma.generatedAsset.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!asset) {
      return NextResponse.json({ error: "Asset not found or access denied" }, { status: 404 });
    }

    const updated = await prisma.generatedAsset.update({
      where: { id: params.id },
      data: {
        ...(typeof body.isGoldenExample === "boolean" && { isGoldenExample: body.isGoldenExample }),
        ...(body.title && { title: body.title }),
        ...(body.tags && { tags: body.tags }),
      },
    });

    // ── GOLDEN LOOP BRIDGE ──
    // If it was just marked as golden, analyze structure and save to golden_examples table
    if (body.isGoldenExample === true && !asset.isGoldenExample) {
        try {
            // Check if already exists in golden_examples
            const existing = await prisma.goldenExample.findFirst({
                where: { userId: user.id, sourcePostId: asset.id }
            });

            if (!existing) {
                // Perform micro-analysis of the structured content
                const analysisResult = await callSarvamJSON(
                    `You are a content structure analyst. Analyze this generated real estate post. Extract:
                    1. Opening hook pattern
                    2. Emotional trigger
                    3. Sentence rhythm
                    4. Call-to-action style
                    Return as JSON with these keys: opening_hook_pattern, emotional_trigger, sentence_rhythm, cta_style`,
                    `Analyze this post:\n\n${asset.body.substring(0, 1500)}`,
                    500
                ).catch(() => null);

                await prisma.goldenExample.create({
                    data: {
                        userId: user.id,
                        platform: asset.platform || "unknown",
                        postText: asset.body,
                        engagementScore: 10.0, // High baseline for user-approved gems
                        structureAnalysis: analysisResult ? JSON.stringify(analysisResult) : null,
                        sourcePostId: asset.id,
                    }
                });
            }
        } catch (err) {
            console.error("[GOLDEN_LOOP_BRIDGE_FAILURE]", err);
        }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[PATCH_GENERATED_ASSET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/generated-assets/[id] — delete a single asset
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.generatedAsset.deleteMany({
      where: { id: params.id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE_GENERATED_ASSET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
