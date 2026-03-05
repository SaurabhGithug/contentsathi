# SETUP INSTRUCTIONS — Phase Z

## 1. Install Dependencies

```bash
npm install razorpay resend cloudinary @cloudinary/url-gen cheerio youtube-transcript node-fetch crypto-js prisma @prisma/client recharts date-fns @radix-ui/react-dialog @radix-ui/react-popover @radix-ui/react-toast @radix-ui/react-tabs @radix-ui/react-switch @radix-ui/react-select @radix-ui/react-tooltip clsx tailwind-merge lucide-react next-auth zod
```

## 2. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in ALL values in `.env.local`. Minimum required to run locally:

- `GEMINI_API_KEY` (for content generation)
- `DATABASE_URL` (Supabase connection string)
- `NEXTAUTH_SECRET` (any random 32-char string)
- `NEXTAUTH_URL=http://localhost:3000`

## 3. Database Migration

Run database migrations (if using Prisma):

```bash
npx prisma migrate dev --name init
```

OR (faster for development — skips migration files):

```bash
npx prisma db push
```

## 4. Run Seed

Seed the database with default data:

```bash
npx prisma db seed
```

This creates:

- Default plan tiers in DB
- Indian festival calendar entries
- Nagpur locality data
- Default content templates
- One demo user (`email: demo@contentsathi.in`, `password: Demo@1234`) for testing.

## 5. Start Development Server

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## 6. Testing

### Test Content Generation (Minimum Viable Test)

1. Login with demo account.
2. Go to `/generator`.
3. Enter topic: _"Why Nagpur is best city for real estate investment"_
4. Select: Instagram + WhatsApp, Marathi + Hinglish
5. Click **Generate Campaign**
6. Verify: posts appear in right panel with quality scores.

### Test Publishing (Requires Connected Accounts)

1. Go to **Settings → Connected Accounts**
2. Connect at least Instagram or LinkedIn using OAuth flow.
3. Go to `/generator`, generate a post.
4. Click **Publish Now** on any post card.
5. Verify post appears on the platform.

## 7. Deploy to Vercel

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Contentsathi MVP v1.0"
   git remote add origin {your-github-repo-url}
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) → **New Project**, and import your GitHub repository.
3. Add all environment variables from `.env.local` into **Vercel Dashboard → Settings → Environment Variables**.
   _IMPORTANT: Change these for production:_
   - `NEXTAUTH_URL=https://contentsathi.in`
   - All OAuth redirect URIs must be updated in each platform's developer console.
4. Deploy. Vercel will auto-detect Next.js and configure build settings.
5. After deploy, run production migration from your local machine (pointing to production `DATABASE_URL`):
   ```bash
   npx prisma migrate deploy
   ```
6. Verify cron jobs are active (**Vercel Dashboard → Project → Cron Jobs tab**):
   - `/api/cron/publish-scheduled` (every 5 min)
   - `/api/cron/fetch-analytics` (daily 6am IST)
   - `/api/analytics/weekly-insight` (Monday 8am IST)
   - `/api/cron/reset-credits` (1st of month midnight)

## 8. Third-Party Webhooks

### Razorpay Webhooks (Production)

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://contentsathi.in/api/payments/webhook`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `refund.created`
4. Copy webhook secret → `RAZORPAY_WEBHOOK_SECRET` in Vercel env vars.

### WhatsApp Business Webhook (Delivery Receipts)

1. Go to Meta Developer Console → Your App → WhatsApp → Configuration
2. Webhook URL: `https://contentsathi.in/api/webhooks/whatsapp`
3. Verify token: set any string in env as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
4. Subscribe to: `messages`, `message_deliveries`

## 9. Custom Domain Setup

1. Purchase `contentsathi.in` on GoDaddy.
2. In Vercel → Project → Settings → Domains:
   - Add: `contentsathi.in` and `www.contentsathi.in`
3. Update GoDaddy DNS:
   - Add CNAME record: `www` → `cname.vercel-dns.com`
   - Add A record: `@` → `76.76.21.21`
4. SSL auto-provisions via Vercel (Let's Encrypt). Wait 5-10 minutes for propagation.

---

# ADDITIONAL NOTES FOR IMPLEMENTATION

## SECURITY REQUIREMENTS

### 1. Token Encryption

All OAuth access tokens and refresh tokens stored in DB must be AES-256 encrypted using `TOKEN_ENCRYPTION_KEY` from env.

**Usage:**

```typescript
import CryptoJS from "crypto-js";

export function encryptToken(token: string): string {
  return CryptoJS.AES.encrypt(
    token,
    process.env.TOKEN_ENCRYPTION_KEY!,
  ).toString();
}

export function decryptToken(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(
    encrypted,
    process.env.TOKEN_ENCRYPTION_KEY!,
  );
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

Store `encryptToken(accessToken)` in DB. Use `decryptToken(storedToken)` before API calls.

### 2. API Rate Limiting

Add rate limiting to all public and semi-public routes (in-memory for dev, Upstash Redis for prod).

- `/api/generate/*` → 20 requests/hour per user
- `/api/publish/*` → 50 requests/hour per user
- `/api/v1/*` (public API) → 100 requests/hour per API key
- `/api/auth/*` → 10 requests/15 minutes per IP
- `/api/payments/*` → 5 requests/minute per user

On limit exceeded, return HTTP `429`:

```json
{
  "success": false,
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please wait before trying again.",
  "retryAfter": 120
}
```

### 3. Input Sanitisation

On ALL text inputs that go into prompts or DB:

- Strip HTML tags using a simple regex.
- Limit lengths:
  - Topic: max 500 characters
  - Brand description: max 1000 characters
  - Post body: max 5000 characters
  - WhatsApp message: max 1000 characters
- Reject inputs containing SQL injection patterns, script tags, or prompt injection attempts (e.g., "ignore previous", "you are now").
- Show friendly error: _"Please enter a valid topic without special characters."_

### 4. CORS Configuration

In `next.config.js`, set strict CORS:

- Allow requests only from:
  - `http://localhost:3000` (dev)
  - `https://contentsathi.in` (production)
  - `https://www.contentsathi.in` (production www)
- Block all other origins for `/api/*` routes.

### 5. Cron Job Protection

All `/api/cron/*` routes must check for the `Authorization` header: `Bearer {CRON_SECRET}`. Vercel automatically adds this header. Return HTTP `401` if header missing or wrong.

### 6. Webhook Signature Verification

All incoming webhooks (`/api/payments/webhook`, `/api/webhooks/whatsapp`) must verify the platform's signature before processing. Never process a webhook without signature check.
