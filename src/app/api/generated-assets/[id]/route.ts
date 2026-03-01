import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
