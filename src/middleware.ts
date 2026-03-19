import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit, detectRouteCategory, RATE_LIMITS, rateLimitResponse } from "@/lib/utils/rate-limiter";

const PROTECTED_ROUTES = [
  "/cao",
  "/settings",
  "/calendar",
  "/dashboard",
  "/studio",
  "/agents",
  "/approvals",
  "/repurpose",
  "/generator",
  "/whatsapp-sequences",
  "/templates",
  "/analytics",
  "/library",
  "/market-watch",
  "/pricing",
];

const ADMIN_ROUTES = ["/admin"];

// Cookie name differs between environments
const COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Fetch token ONCE, reuse for both rate limiting and route protection ──
  let token: any = null;

  // Only call getToken when we actually need it (authenticated routes)
  const needsAuth = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const needsAdmin = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const category = detectRouteCategory(pathname);
  const needsTokenForRateLimit =
    category === "generate" || category === "publish" || category === "payments";

  if (needsAuth || needsAdmin || needsTokenForRateLimit) {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: COOKIE_NAME,
    });
  }

  // ── 2. API Rate Limiting ─────────────────────────────────────────────────
  if (category && RATE_LIMITS[category]) {
    let key = request.ip || "127.0.0.1";

    if (needsTokenForRateLimit && token?.sub) {
      key = `user_${token.sub}`;
    } else if (category === "publicApi") {
      const apiKey = request.headers.get("x-api-key") || "anonymous";
      key = `apikey_${apiKey}`;
    }

    const { success, retryAfter } = rateLimit(`${category}:${key}`, RATE_LIMITS[category]!);

    if (!success) {
      return NextResponse.json(rateLimitResponse(retryAfter), {
        status: 429,
        headers: { "Retry-After": retryAfter.toString() },
      });
    }
  }

  // ── 3. Route Protection ──────────────────────────────────────────────────
  if (needsAuth) {
    if (!token) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", encodeURIComponent(pathname));
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── 4. Admin Route Protection ────────────────────────────────────────────
  if (needsAdmin) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    if (!token.isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static assets)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
