import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    let calendarItemId: string | undefined;
    try {
      const bodyText = await req.json();
      const { userId, title, body, imageUrl, accessToken, providerAccountId } = bodyText;
      calendarItemId = bodyText.calendarItemId;

    if (!providerAccountId || !accessToken) {
      return NextResponse.json({ error: "LinkedIn account not connected." }, { status: 400 });
    }

    // Determine urn (either organization urn or person urn based on auth)
    // We assume the stored providerAccountId is the correct Urn (e.g., 'urn:li:person:12345')
    // If it's just raw IDs, we should wrap it. Often NextAuth LinkedIn provider returns just the ID.
    const authorUrn = providerAccountId.startsWith("urn:li:") 
      ? providerAccountId 
      : `urn:li:person:${providerAccountId}`;

    let mediaUrn: string | null = null;

    // ── STEP 1: Upload Image (if provided) ─────────────────────────────────
    if (imageUrl) {
      // 1a. Register Upload
      const registerUrl = "https://api.linkedin.com/v2/assets?action=registerUpload";
      const registerBody = {
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: authorUrn,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent"
            }
          ]
        }
      };

      const registerRes = await fetch(registerUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0"
        },
        body: JSON.stringify(registerBody)
      });

      const registerData = await registerRes.json();
      
      if (!registerRes.ok) {
        console.error("[LI_REGISTER_UPLOAD_ERROR]", registerData);
        // We can gracefully degrade to text-only if image upload fails, but usually we want to throw
        throw new Error(registerData.message || "Failed to register LinkedIn upload");
      }

      mediaUrn = registerData.value.asset;
      const uploadUrl = registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;

      // 1b. Fetch Image Buffer from Cloudinary and PUT to LinkedIn
      try {
        const imageFetchRes = await fetch(imageUrl);
        const imageBuffer = await imageFetchRes.arrayBuffer();

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            // We'll let fetch determine the exact Content-Type, or we can force octet-stream
          },
          body: imageBuffer
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload binary image to LinkedIn. Status: ${uploadRes.status}`);
        }
      } catch (uploadErr) {
        console.error("[LI_BINARY_UPLOAD_ERROR]", uploadErr);
        // If image upload fails, we'll just post text without image
        mediaUrn = null; 
      }
    }

    // ── STEP 2: Create Ugc Post ────────────────────────────────────────────
    const ugcBody: any = {
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: body // LinkedIn feed share body
          },
          shareMediaCategory: mediaUrn ? "IMAGE" : "NONE",
        }
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    };

    if (mediaUrn) {
      ugcBody.specificContent["com.linkedin.ugc.ShareContent"].media = [
        {
          status: "READY",
          // The title is strictly required when sharing media via UGC API
          title: { text: title || "Real Estate Update" }, 
          media: mediaUrn
        }
      ];
    }

    const postUrl = "https://api.linkedin.com/v2/ugcPosts";
    const postRes = await fetch(postUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
      },
      body: JSON.stringify(ugcBody)
    });

    const postData = await postRes.json();

    if (!postRes.ok) {
      console.error("[LI_UGC_POST_ERROR]", postData);
      return NextResponse.json({ error: postData.message || "Failed to publish to LinkedIn feed." }, { status: 500 });
    }

    // LinkedIn returns standard URNs. e.g. "urn:li:share:12345" or "urn:li:ugcPost:12345"
    const platformPostUrl = `https://www.linkedin.com/feed/update/${postData.id}/`;

    if (calendarItemId) {
      await prisma.calendarItem.update({
        where: { id: calendarItemId },
        data: {
          status: "published",
          platformPostId: postData.id,
          platformPostUrl,
          publishedAt: new Date(),
        }
      });
    }

    return NextResponse.json({
      success: true,
      platformPostId: postData.id,
      platformPostUrl,
    });

  } catch (error: any) {
    console.error(`[PUBLISH_LINKEDIN_ERROR]`, error);
    if (calendarItemId) {
      try {
        await prisma.calendarItem.update({
          where: { id: calendarItemId },
          data: { status: "failed", failureReason: error.message },
        });
      } catch (e) { console.error("Failed to update LI error status", e); }
    }
    return NextResponse.json(
      { error: "LinkedIn publishing failed: " + error.message },
      { status: 500 }
    );
  }
}
