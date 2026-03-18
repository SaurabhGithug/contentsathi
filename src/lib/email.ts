
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
