
/**
 * ContentSathi Email Service
 * Handles transactional emails (Password Reset, Payment Confirmation, Admin Alerts)
 * Uses Resend API for delivery.
 */

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

/**
 * Generic email sender for admin alerts and custom notifications.
 */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.log(`[EMAIL_MOCK] To: ${to} | Subject: ${subject}`);
    return { success: true, mocked: true };
  }
  try {
    await resend.emails.send({ from: 'ContentSathi <noreply@contentsathi.in>', to, subject, html });
    return { success: true };
  } catch (err) {
    console.error('[EMAIL_ERROR]:', err);
    return { success: false, error: err };
  }
}

/**
 * Send a "Forgot Password" email with a recovery link.
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (!resend) {
    console.log(`[EMAIL_MOCK] To: ${email} | Subject: Reset your ContentSathi Password | Link: ${resetUrl}`);
    return { success: true, mocked: true };
  }

  try {
    await resend.emails.send({
      from: 'ContentSathi <noreply@contentsathi.in>',
      to: email,
      subject: 'Reset your ContentSathi Password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #4f46e5;">ContentSathi Password Reset</h2>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Reset Password</a>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
          <p style="font-size: 12px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">© 2026 ContentSathi AI Content Engine</p>
        </div>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error('[EMAIL_ERROR] Password Reset:', err);
    return { success: false, error: err };
  }
}

/**
 * Send a "Payment Confirmation" email after successful upgrade.
 */
export async function sendPaymentConfirmationEmail(email: string, planName: string, amount: string) {
  if (!resend) {
    console.log(`[EMAIL_MOCK] To: ${email} | Subject: Welcome to ContentSathi ${planName} | Body: Thanks for your payment of ${amount}.`);
    return { success: true, mocked: true };
  }

  try {
    await resend.emails.send({
      from: 'ContentSathi <noreply@contentsathi.in>',
      to: email,
      subject: `Welcome to ContentSathi ${planName}!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #4f46e5;">Payment Successful!</h2>
          <p>Thanks for upgrading to the <strong>${planName}</strong> plan on ContentSathi.</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">Amount Paid</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #111;">${amount}</p>
          </div>
          <p>Your new credits are now available in your dashboard. You can start generating professional content immediately.</p>
          <a href="https://contentsathi.vercel.app/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Go to Dashboard</a>
          <p style="font-size: 12px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">© 2026 ContentSathi AI Content Engine</p>
        </div>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error('[EMAIL_ERROR] Payment Confirmation:', err);
    return { success: false, error: err };
  }
}

/**
 * Send a "Waitlist Confirmation" email after joining the waitlist.
 */
export async function sendWaitlistConfirmationEmail(email: string) {
  if (!resend) {
    console.log(`[EMAIL_MOCK] To: ${email} | Subject: You're on the list! | Body: Welcome to the ContentSathi Waitlist.`);
    return { success: true, mocked: true };
  }

  try {
    await resend.emails.send({
      from: 'ContentSathi <noreply@contentsathi.in>',
      to: email,
      subject: "You're on the list! Welcome to ContentSathi 🚀",
      html: `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">
          <div style="text-align: center; padding: 40px 0;">
            <div style="display: inline-block; background: #4f46e5; color: white; width: 60px; height: 60px; line-height: 60px; border-radius: 20px; font-size: 30px; font-weight: bold; margin-bottom: 20px;">S</div>
            <h1 style="color: #111827; margin: 0; font-size: 24px; font-weight: 800;">Welcome to ContentSathi!</h1>
            <p style="color: #6b7280; font-size: 16px; margin-top: 8px;">You've successfully joined our early-access waitlist.</p>
          </div>
          
          <div style="background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 24px; padding: 32px; margin-bottom: 32px;">
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: #be185d;">What happens next?</p>
            <p style="margin-top: 12px; color: #831843; font-size: 15px;">We're currently letting users in batch by batch to ensure the best experience. As soon as a slot opens up for you, we'll send an invite to this email address.</p>
          </div>

          <div style="margin-bottom: 40px;">
            <h2 style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 16px;">While you wait, here's what's coming:</h2>
            <ul style="padding: 0; margin: 0; list-style: none;">
              <li style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                <span style="margin-right: 12px;">✅</span>
                <span><strong>Autonomous Content:</strong> AI that learns your brand and posts daily.</span>
              </li>
              <li style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                <span style="margin-right: 12px;">✅</span>
                <span><strong>Market Intelligence:</strong> Track competitors and trends automatically.</span>
              </li>
              <li style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                <span style="margin-right: 12px;">✅</span>
                <span><strong>Multi-Platform Publishing:</strong> One-click schedule to LinkedIn, IG, and more.</span>
              </li>
            </ul>
          </div>

          <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 40px; color: #9ca3af; font-size: 12px;">
            <p>© 2026 ContentSathi AI Content Engine</p>
            <p>Nagpur, Maharashtra, India</p>
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error('[EMAIL_ERROR] Waitlist Confirmation:', err);
    return { success: false, error: err };
  }
}
