import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limiter";

const FEATURE_FLAG_ENABLED = process.env.ENABLE_IMAGE_GENERATION !== "false";

const STYLE_MODIFIERS: Record<string, string> = {
  realistic: "photorealistic, high quality DSLR photography, natural lighting, 8k",
  flat: "flat illustration, vector art, minimal, clean design, 2D",
  bold: "bold graphic design, high contrast, vibrant colors, marketing poster",
};

async function tryStabilityAI(prompt: string, style: string): Promise<string | null> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) return null;

  const enhancedPrompt = `${prompt}, ${STYLE_MODIFIERS[style] || ""}`;

  try {
    const res = await fetch(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          text_prompts: [{ text: enhancedPrompt, weight: 1 }],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: 1,
          steps: 30,
        }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const base64 = data.artifacts?.[0]?.base64;
    if (!base64) return null;
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}

async function tryImagenAPI(prompt: string, style: string): Promise<string | null> {
  const apiKey = process.env.IMAGEN_API_KEY;
  if (!apiKey) return null;

  const enhancedPrompt = `${prompt}, ${STYLE_MODIFIERS[style] || ""}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: enhancedPrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1",
          },
        }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const base64 = data.predictions?.[0]?.bytesBase64Encoded;
    if (!base64) return null;
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}

function getPlaceholderImage(style: string, seed?: number): string {
  const s = seed || Math.floor(Math.random() * 1000);
  const dimensions =
    style === "flat" ? "800/600" : style === "bold" ? "1080/1080" : "1200/800";
  return `https://picsum.photos/seed/${s}/${dimensions}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email || req.headers.get("x-forwarded-for") || "anonymous";

    // Rate Limit Check
    const limiter = rateLimit(`generate:${userId}`, RATE_LIMITS.generate);
    if (!limiter.success) {
      return NextResponse.json(rateLimitResponse(limiter.retryAfter), { status: 429 });
    }

    const body = await req.json();
    const { prompt: rawPrompt, style = "realistic" } = body;

    if (!rawPrompt || typeof rawPrompt !== "string" || !rawPrompt.trim()) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    let prompt = "";
    try {
      prompt = sanitizeText(rawPrompt, 1000);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    const validStyles = ["realistic", "flat", "bold"];
    const safeStyle = validStyles.includes(style) ? style : "realistic";

    if (!FEATURE_FLAG_ENABLED) {
      return NextResponse.json({
        imageUrl: getPlaceholderImage(safeStyle),
        isPlaceholder: true,
        message: "Image generation is disabled. Set ENABLE_IMAGE_GENERATION=true to enable.",
      });
    }

    const hasStability = !!process.env.STABILITY_API_KEY;
    const hasImagen = !!process.env.IMAGEN_API_KEY;

    if (!hasStability && !hasImagen) {
      // No API key — return picsum placeholder with message
      return NextResponse.json({
        imageUrl: getPlaceholderImage(safeStyle),
        isPlaceholder: true,
        message:
          "Add IMAGEN_API_KEY or STABILITY_API_KEY to your .env to enable real image generation.",
      });
    }

    // Try Stability AI first (faster, cheaper), then Imagen
    let imageUrl: string | null = null;

    if (hasStability) {
      imageUrl = await tryStabilityAI(prompt, safeStyle);
    }

    if (!imageUrl && hasImagen) {
      imageUrl = await tryImagenAPI(prompt, safeStyle);
    }

    if (!imageUrl) {
      // API key set but call failed — still serve a placeholder
      return NextResponse.json({
        imageUrl: getPlaceholderImage(safeStyle),
        isPlaceholder: true,
        message: "Image API call failed. Check your API key and quota.",
      });
    }

    return NextResponse.json({ imageUrl, isPlaceholder: false });
  } catch (err: any) {
    console.error("[/api/generate/image]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
