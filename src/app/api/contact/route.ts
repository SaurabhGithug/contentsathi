import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const ADMIN_EMAIL = "dangalesaurabh1996@gmail.com";

// Map inquiry types to which admin team should handle it
const INQUIRY_ROUTING: Record<string, string> = {
  general: "Support Team",
  sales_pricing: "Sales Team",
  technical: "Technical Team",
  api_access: "Technical Team",
  partnership: "Sales Team",
  billing: "Finance Team",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, inquiryType, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }

    if (message.length > 300) {
      return NextResponse.json({ error: "Message must be 300 characters or less" }, { status: 400 });
    }

    // We use a system/admin user ID for contact form leads (not linked to a real user account)
    // Find the admin user to attach it to
    const adminUser = await prisma.user.findFirst({
      where: { email: ADMIN_EMAIL },
    });

    if (!adminUser) {
      // Optionally still return success but just log it
      console.warn("No admin user found to attach contact lead to");
      return NextResponse.json({ success: true });
    }

    // Save to database
    await prisma.lead.create({
      data: {
        userId: adminUser.id,
        source: "contact_form",
        contactSource: inquiryType || "general",
        name: name.trim().substring(0, 100),
        email: email.trim().toLowerCase(),
        phone: phone?.trim().substring(0, 20),
        message: message.trim().substring(0, 300),
        status: "new",
      },
    });

    // Send notification email to admin
    const routedTo = INQUIRY_ROUTING[inquiryType] || "Support Team";
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `🔔 New ${routedTo} Lead: ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
          <div style="background: #4f46e5; color: white; padding: 16px 24px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 18px;">📨 New Lead from Contact Form</h2>
          </div>
          <table style="width: 100%; background: white; border-radius: 8px; border: 1px solid #e5e7eb; padding: 20px; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px; font-weight: bold;">Name</td><td style="padding: 8px 0; color: #111827;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px; font-weight: bold;">Email</td><td style="padding: 8px 0; color: #4f46e5;">${email}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px; font-weight: bold;">Phone</td><td style="padding: 8px 0; color: #111827;">${phone || "Not provided"}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px; font-weight: bold;">Type</td><td style="padding: 8px 0;"><span style="background: #e0e7ff; color: #4f46e5; padding: 2px 8px; border-radius: 20px; font-weight: bold; font-size: 12px;">${routedTo}</span></td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px; font-weight: bold; vertical-align: top;">Message</td><td style="padding: 8px 0; color: #111827; line-height: 1.6;">${message}</td></tr>
          </table>
          <p style="margin-top: 16px; text-align: center;">
            <a href="https://contentsathi.in/admin?tab=leads" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">View in Admin Panel →</a>
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 });
  }
}
