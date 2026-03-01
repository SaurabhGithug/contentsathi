import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    // Defaulting to user-1 if auth fails for MVP testing
    const userId = session?.user?.email || "user-1";
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { originalContent, platform, instructions } = body;

    if (!originalContent) {
      return NextResponse.json({ error: "originalContent is required" }, { status: 400 });
    }

    const prompt = `
You are an expert social media manager.
I have a previously published post for ${platform || 'social media'}.
Please rewrite and refresh it for today's date so I can republish it.
Keep the same core message, but make it feel fresh and new.

Original Post:
"""
${originalContent}
"""

Additional Instructions: 
${instructions || "Update any references to timing (like 'last week') to make sense today. Change the hook slightly."}

Return ONLY the rewritten text, ready to be published. Do not include markdown formatting like \`\`\` text \`\`\` unless it's part of the post.
`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return NextResponse.json({ refreshedContent: text.trim() });
    } catch (primaryError: any) {
      console.warn("[REFRESH_POST_PRIMARY_ERROR] gemini-2.0-flash failed, trying fallback:", primaryError.message);
      
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await fallbackModel.generateContent(prompt);
        const text = result.response.text();
        return NextResponse.json({ refreshedContent: text.trim() });
      } catch (fallbackError: any) {
        console.error("[REFRESH_POST_FALLBACK_ERROR]", fallbackError);
        
        const errMsg = fallbackError.message || primaryError.message || "";
        if (errMsg.includes("429") || errMsg.includes("Quota exceeded")) {
          return NextResponse.json(
            { error: "AI rate limit exceeded. Please wait about 30 seconds and try again." },
            { status: 429 }
          );
        }
        
        return NextResponse.json(
          { error: "Failed to refresh post due to an AI service error." },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error("[REFRESH_POST_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}
