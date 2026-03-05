// ─── Contentsathi Email Templates & Sender ──────────────────────────────
// Uses Resend SDK when RESEND_API_KEY is set, otherwise logs to console.

const BRAND_PRIMARY = "#6366f1";
const BRAND_BG = "#f8f7ff";
const BRAND_TEXT = "#1a1a2e";

function emailWrapper(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:${BRAND_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(99,102,241,0.08);">
  <tr><td style="background:linear-gradient(135deg,${BRAND_PRIMARY},#818cf8);padding:32px 40px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">Contentsathi</h1>
  </td></tr>
  <tr><td style="padding:32px 40px;color:${BRAND_TEXT};font-size:15px;line-height:1.7;">
    ${bodyHtml}
  </td></tr>
  <tr><td style="padding:20px 40px 32px;text-align:center;color:#888;font-size:12px;border-top:1px solid #f0f0f0;">
    © ${new Date().getFullYear()} Contentsathi · Made in India 🇮🇳
  </td></tr>
</table>
</body></html>`;
}

// ─── Email send function ──────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[EMAIL] Would send to ${to}: "${subject}" (RESEND_API_KEY not set)`);
    return { success: true, mock: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "Contentsathi <noreply@contentsathi.in>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("[EMAIL] Resend error:", err);
    throw new Error(`Email send failed: ${JSON.stringify(err)}`);
  }

  return { success: true };
}

// ─── Welcome Email ────────────────────────────────────────────────────────

export async function sendWelcomeEmail(params: { email: string; name: string }) {
  const html = emailWrapper(
    "Welcome to Contentsathi!",
    `
    <h2 style="color:${BRAND_PRIMARY};margin:0 0 16px;">Contentsathi pe aapka swagat hai! 🎉</h2>
    <p>Hi <strong>${params.name}</strong>,</p>
    <p>Welcome aboard! You now have <strong>100 free credits</strong> to start creating amazing content.</p>
    <h3 style="margin:24px 0 12px;color:${BRAND_TEXT};">Quick Start Checklist:</h3>
    <table cellpadding="0" cellspacing="0" style="width:100%;">
      <tr><td style="padding:8px 0;">✅ Set up your <strong>Content Brain</strong> (brand voice &amp; audience)</td></tr>
      <tr><td style="padding:8px 0;">📱 Connect your <strong>social accounts</strong></td></tr>
      <tr><td style="padding:8px 0;">🚀 Create your <strong>first campaign</strong></td></tr>
      <tr><td style="padding:8px 0;">📅 Schedule posts on the <strong>Content Calendar</strong></td></tr>
    </table>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://contentsathi.in/dashboard" style="background:${BRAND_PRIMARY};color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
        Go to Dashboard →
      </a>
    </div>
    <p style="color:#666;font-size:13px;">Questions? Reply to this email or WhatsApp us!</p>
    `
  );

  return sendEmail(params.email, "Contentsathi pe aapka swagat hai! 🎉", html);
}

// ─── Plan Upgrade Email ───────────────────────────────────────────────────

export async function sendUpgradeEmail(params: {
  email: string;
  name: string;
  planName: string;
  credits: number;
}) {
  const creditsText = params.credits === -1 ? "Unlimited" : String(params.credits);
  const html = emailWrapper(
    "Plan Upgrade Successful!",
    `
    <h2 style="color:${BRAND_PRIMARY};margin:0 0 16px;">Plan upgrade successful! 🎊</h2>
    <p>Hi <strong>${params.name}</strong>,</p>
    <p>You're now on the <strong style="color:${BRAND_PRIMARY};">${params.planName} Plan</strong>!</p>
    <div style="background:${BRAND_BG};border-radius:12px;padding:20px;margin:20px 0;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr><td style="padding:6px 0;font-weight:600;">Credits Balance</td><td style="text-align:right;color:${BRAND_PRIMARY};font-weight:700;">${creditsText}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Plan</td><td style="text-align:right;">${params.planName}</td></tr>
      </table>
    </div>
    <p><strong>What's unlocked:</strong></p>
    <ul style="padding-left:20px;">
      <li>YouTube Research & competitor analysis</li>
      <li>Advanced analytics dashboard</li>
      <li>Bulk content export</li>
      <li>Priority support</li>
    </ul>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://contentsathi.in/generator" style="background:${BRAND_PRIMARY};color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
        Start Creating →
      </a>
    </div>
    `
  );

  return sendEmail(params.email, `Plan upgrade successful — you're on ${params.planName}!`, html);
}

// ─── Low Credits Warning ──────────────────────────────────────────────────

export async function sendLowCreditsEmail(params: {
  email: string;
  name: string;
  creditsRemaining: number;
}) {
  const html = emailWrapper(
    "Credits Running Low",
    `
    <h2 style="color:#f59e0b;margin:0 0 16px;">Aapke credits khatam ho rahe hain ⚠️</h2>
    <p>Hi <strong>${params.name}</strong>,</p>
    <p>You have only <strong style="color:#ef4444;">${params.creditsRemaining} credits</strong> remaining this month.</p>
    <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:12px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#92400e;">
        <strong>What you can still do:</strong><br>
        • Generate ~${Math.floor(params.creditsRemaining / 10)} campaigns (10 credits each)<br>
        • Repurpose ~${Math.floor(params.creditsRemaining / 8)} articles (8 credits each)<br>
        • Translate ~${Math.floor(params.creditsRemaining / 2)} posts (2 credits each)
      </p>
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://contentsathi.in/pricing" style="background:${BRAND_PRIMARY};color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
        Upgrade for More →
      </a>
    </div>
    `
  );

  return sendEmail(params.email, "Aapke credits khatam ho rahe hain ⚠️", html);
}

// ─── Payment Failed Email ─────────────────────────────────────────────────

export async function sendPaymentFailedEmail(params: {
  email: string;
  name: string;
}) {
  const html = emailWrapper(
    "Payment Failed",
    `
    <h2 style="color:#ef4444;margin:0 0 16px;">Payment failed — update your payment method</h2>
    <p>Hi <strong>${params.name}</strong>,</p>
    <p>We couldn't process your recent payment. Your plan will remain active for 3 more days — after that, you'll be moved to the Free plan.</p>
    <p><strong>Common reasons:</strong></p>
    <ul style="padding-left:20px;color:#666;">
      <li>Insufficient balance</li>
      <li>Card expired</li>
      <li>Bank declined the transaction</li>
    </ul>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://contentsathi.in/pricing" style="background:#ef4444;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
        Retry Payment →
      </a>
    </div>
    <p style="color:#666;font-size:13px;">Need help? Email us at support@contentsathi.in</p>
    `
  );

  return sendEmail(params.email, "Payment failed — update your payment method", html);
}

// ─── Weekly Summary Email ─────────────────────────────────────────────────

export async function sendWeeklySummaryEmail(params: {
  email: string;
  name: string;
  postsPublished: number;
  topPost?: string;
  creditsRemaining: number;
  nextWeekSuggestion?: string;
}) {
  const html = emailWrapper(
    "Your Weekly Summary",
    `
    <h2 style="color:${BRAND_PRIMARY};margin:0 0 16px;">This week on Contentsathi 📊</h2>
    <p>Hi <strong>${params.name}</strong>, here's your weekly content digest:</p>
    <div style="background:${BRAND_BG};border-radius:12px;padding:20px;margin:20px 0;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr><td style="padding:8px 0;font-weight:600;">📝 Posts Published</td><td style="text-align:right;font-weight:700;color:${BRAND_PRIMARY};">${params.postsPublished}</td></tr>
        ${params.topPost ? `<tr><td style="padding:8px 0;font-weight:600;">🏆 Top Post</td><td style="text-align:right;">${params.topPost}</td></tr>` : ""}
        <tr><td style="padding:8px 0;font-weight:600;">💳 Credits Remaining</td><td style="text-align:right;">${params.creditsRemaining}</td></tr>
      </table>
    </div>
    ${params.nextWeekSuggestion ? `
    <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:12px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-weight:700;color:#065f46;">💡 Next week suggestion:</p>
      <p style="margin:8px 0 0;color:#047857;">${params.nextWeekSuggestion}</p>
    </div>` : ""}
    <div style="text-align:center;margin:32px 0;">
      <a href="https://contentsathi.in/dashboard" style="background:${BRAND_PRIMARY};color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
        View Dashboard →
      </a>
    </div>
    `
  );

  return sendEmail(params.email, `This week on Contentsathi — ${params.postsPublished} posts published`, html);
}
