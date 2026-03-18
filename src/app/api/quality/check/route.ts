import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { performQualityCheck } from "@/lib/quality";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, language } = await req.json();

    if (!text || !language) {
      return NextResponse.json({ error: "Text and language are required" }, { status: 400 });
    }

    const result = performQualityCheck(text, language);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("[QUALITY_CHECK_ERROR]", error);
    return NextResponse.json({ error: "Failed to run quality check" }, { status: 500 });
  }
}
