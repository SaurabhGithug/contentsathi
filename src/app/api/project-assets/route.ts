import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
import { prisma } from "@/lib/db/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET — list all project assets for the user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const fileType    = searchParams.get("fileType");
  const projectName = searchParams.get("projectName");

  const assets = await prisma.projectAsset.findMany({
    where: {
      userId: user.id,
      ...(fileType    ? { fileType }    : {}),
      ...(projectName ? { projectName } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ assets });
}

// POST — upload a new project asset (multipart/form-data)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    const formData = await req.formData();
    const file           = formData.get("file") as File | null;
    const name           = (formData.get("name") as string) || "Untitled";
    const description    = (formData.get("description") as string) || "";
    const fileType       = (formData.get("fileType") as string) || "image";
    const corridor       = (formData.get("corridor") as string) || "";
    const projectName    = (formData.get("projectName") as string) || "";
    const useInChat      = formData.get("useInChat") !== "false";
    const useAsKnowledge = formData.get("useAsKnowledge") !== "false";
    const tagsRaw        = (formData.get("tags") as string) || "";
    const tags           = tagsRaw ? tagsRaw.split(",").map((t: string) => t.trim()).filter(Boolean) : [];

    let fileUrl  = "";
    let mimeType = "";
    let fileSize = 0;

    if (file && file.size > 0) {
      const bytes     = await file.arrayBuffer();
      const buffer    = Buffer.from(bytes);
      const ext       = path.extname(file.name) || "";
      const safeName  = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "projects");

      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, safeName), buffer);

      fileUrl  = `/uploads/projects/${safeName}`;
      mimeType = file.type;
      fileSize = file.size;
    }

    const asset = await prisma.projectAsset.create({
      data: {
        userId: user.id,
        name,
        description,
        fileType,
        mimeType,
        fileUrl,
        fileSize,
        corridor:    corridor    || null,
        projectName: projectName || null,
        useInChat,
        useAsKnowledge,
        tags,
      },
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (err: any) {
    console.error("ProjectAsset upload error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}

// DELETE — remove a project asset
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.projectAsset.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}

// PATCH — update metadata (useInChat, useAsKnowledge, description)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const result = await prisma.projectAsset.updateMany({ where: { id, userId: user.id }, data: updates });
  return NextResponse.json({ ok: true, count: result.count });
}
