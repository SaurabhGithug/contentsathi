// ──────────────────────────────────────────────────────────────────────────
// Contentsathi AI Core Logic
// ──────────────────────────────────────────────────────────────────────────

export interface GeneratedPost {
  id: string;
  platform: string;
  type?: string;
  language: string;
  title: string;
  body: string;
  tags: string[] | string; // string[] from v2 prompts, string from legacy/demo
  cta: string;
  ctaType?: string; // legacy compat
  notes: string;
  imagePrompt?: string;
}

export interface CarouselSlide {
  slideNumber: number;
  headline: string;
  bodyText: string;
  visualSuggestion: string;
}

export interface ShortsScript {
  hook: string;
  problem: string;
  solution: string;
  cta: string;
  totalWords: number;
  // legacy compat fields
  title?: string;
  body?: string;
}

export interface BlogOutline {
  title: string;
  sections: string[];
}

export interface GenerationResult {
  posts: GeneratedPost[];
  carouselOutline?: CarouselSlide[];
  // legacy repurpose used 'carousel'
  carousel?: Array<{ slide: number; title: string; content: string }>;
  shortsScript?: ShortsScript;
  blogOutline?: BlogOutline;
}

export async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  options?: { platforms?: string[]; languages?: string[] }
): Promise<GenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.startsWith("AIza")) {
    console.warn("[Gemini] Demo mode — generating mock posts for selected platforms/languages.");
    const { platforms = ["Instagram"], languages = ["English"] } = options || {};
    const posts: GeneratedPost[] = [];
    platforms.forEach((platform) => {
      languages.forEach((language) => {
        posts.push(buildMockPost(platform, language, posts.length + 1));
      });
    });
    return { posts };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.9,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty response from Gemini");

    return JSON.parse(text) as GenerationResult;
  } catch (error) {
    console.error("[Gemini Error]", error);
    throw error;
  }
}

// ── Dynamic mock builder: one post per platform × language ─────────────────

const PLATFORM_TYPES: Record<string, string> = {
  Instagram: "carousel",
  LinkedIn: "post",
  WhatsApp: "broadcast",
  "X (Twitter)": "thread",
  "YouTube Shorts": "script",
  Facebook: "post",
};

const MOCK_BODIES: Record<string, Record<string, string>> = {
  English: {
    Instagram:
      "Slide 1: 🚀 The Real Estate Opportunity You Can't Ignore\nSlide 2: Prices are growing 15-20% annually in Tier-2 cities\nSlide 3: RERA Approved & Clear Title — Zero risk\nSlide 4: Starting at just ₹25 Lakhs\n\nCaption: Don't miss this golden opportunity! Limited plots available. DM us today. 🏡\n\n#RealEstate #Investment #Property #Nagpur",
    LinkedIn:
      "Everyone is looking at Mumbai and Bangalore.\n\nBut smart investors have already moved on.\n\nTier-2 cities are now offering:\n→ 15-20% annual appreciation\n→ Better affordability vs metro cities\n→ Major infrastructure investments underway\n\nIf you missed the Pune boom, this is your Nagpur moment.\n\nDM me to discuss how to get started. 📩\n\n#RealEstateIndia #Investment #Nagpur",
    WhatsApp:
      "🏡 *New Project Alert!*\n\nHello,\nWe are excited to announce our new RERA-approved project!\n📍 Location: Near MIHAN, Nagpur\n💰 Price: Starting ₹25 Lakhs\n✅ RERA Approved | Clear Title\n\nReply *YES* to book a free site visit. 🙏",
    "X (Twitter)":
      "🧵 Why Nagpur real estate is the smartest investment of 2026:\n\n1/ Everyone chases Mumbai & Pune. Smart money is moving to Nagpur.\n\n2/ MIHAN airport + cargo hub = 10L+ jobs incoming. Housing demand is set to explode.\n\n3/ Current prices are 60% lower than Pune. This gap won't last.\n\n4/ We have RERA-approved plots from ₹25L. DM for details.\n\n[End] 🏡",
    "YouTube Shorts":
      "[HOOK - 0-3s]\nThis city will be the next big real estate boom!\n\n[BODY - 3-45s]\n✅ Reason 1: MIHAN project — India's largest SEZ creating 10L jobs\n✅ Reason 2: Prices still 60% below Pune & Hyderabad\n✅ Reason 3: Our RERA-approved plots start at just ₹25 Lakhs\n\n[CTA - 45-60s]\nClick the link in bio or call us today to book your site visit!",
    Facebook:
      "My client once told me:\n'I spent 10 years in the stock market. One plot of land gave me more peace than all of it combined.'\n\nThere's something different about owning land. 🏡\n\nOur new project starts at ₹25 Lakhs — RERA approved, clear title.\n\nComment 'INFO' below and I'll send you full details! 👇\n\n#RealEstate #GharKaSapna #Investment",
  },
  Hindi: {
    Instagram:
      "Slide 1: 🚀 अभी निवेश करने का सही समय!\nSlide 2: हर साल 15-20% की बढ़ोतरी\nSlide 3: RERA अप्रूव्ड और क्लियर टाइटल\nSlide 4: सिर्फ ₹25 लाख से शुरू!\n\nCaption: यह मौका मत छोड़िए! 💫 सीमित प्लॉट उपलब्ध हैं। आज ही DM करें। 🏡\n\n#रियलएस्टेट #निवेश #नागपुर",
    LinkedIn:
      "सभी मुंबई और बैंगलोर की बात करते हैं।\n\nलेकिन समझदार निवेशक आगे सोचते हैं।\n\nटियर-2 शहरों में अभी:\n→ 15-20% सालाना रिटर्न\n→ किफायती कीमतें\n→ बड़े infrastructure प्रोजेक्ट\n\nपुणे की boom miss की? नागपुर आपका अगला मौका है।\n\nDM करें और आज ही बात करते हैं। 📩",
    WhatsApp:
      "🏡 *नया प्रोजेक्ट लॉन्च!*\n\nनमस्ते,\nहम अपना नया RERA अप्रूव्ड प्रोजेक्ट लॉन्च कर रहे हैं!\n📍 स्थान: MIHAN के पास, नागपुर\n💰 कीमत: ₹25 लाख से शुरू\n✅ RERA अप्रूव्ड | क्लियर टाइटल\n\nफ्री साइट विज़िट बुक करने के लिए *YES* रिप्लाई करें। 🙏",
    "X (Twitter)":
      "🧵 2026 में नागपुर रियल एस्टेट में निवेश क्यों करें:\n\n1/ सब मुंबई-पुणे देखते हैं, समझदार पैसा नागपुर में जा रहा है।\n\n2/ MIHAN प्रोजेक्ट से 10 लाख+ नौकरियां आ रही हैं — demand बढ़ेगी।\n\n3/ अभी कीमतें पुणे से 60% कम हैं। यह gap ज़्यादा दिन नहीं रहेगा।\n\n4/ RERA अप्रूव्ड plots ₹25L से। DM करें। 🏡",
    "YouTube Shorts":
      "[HOOK - 0-3s]\nयह शहर अगला बड़ा रियल एस्टेट boom देखेगा!\n\n[BODY - 3-45s]\n✅ कारण 1: MIHAN — India का सबसे बड़ा SEZ, 10 लाख jobs आ रही हैं\n✅ कारण 2: कीमतें अभी पुणे से 60% कम हैं\n✅ कारण 3: हमारे RERA अप्रूव्ड plots सिर्फ ₹25 लाख से शुरू\n\n[CTA - 45-60s]\nBio में link है, या आज ही call करें — free site visit book करें!",
    Facebook:
      "मेरे एक client ने कहा:\n'शेयर market में 10 साल लगाए। एक ज़मीन का टुकड़ा खरीदा — तब से चैन की नींद आती है।'\n\nज़मीन की बात ही अलग है। 🏡\n\nहमारा नया project सिर्फ ₹25 लाख से — RERA अप्रूव्ड, क्लियर टाइटल।\n\nनीचे कमेंट में 'INFO' लिखें और पूरी जानकारी पाएं! 👇",
  },
  Marathi: {
    Instagram:
      "Slide 1: 🚀 आत्ताच गुंतवणूक करा!\nSlide 2: दरवर्षी 15-20% परतावा\nSlide 3: RERA मंजूर आणि स्वच्छ मालकी\nSlide 4: फक्त ₹25 लाखांपासून!\n\nCaption: ही संधी सोडू नका! 💫 मर्यादित plots उपलब्ध. आजच DM करा. 🏡\n\n#रिअलइस्टेट #गुंतवणूक #नागपूर",
    LinkedIn:
      "सर्वजण मुंबई आणि बेंगळुरूची चर्चा करतात.\n\nपण हुशार गुंतवणूकदार पुढचा विचार करतात.\n\nटियर-2 शहरांमध्ये आत्ता:\n→ दरवर्षी 15-20% परतावा\n→ परवडणाऱ्या किमती\n→ मोठे पायाभूत सुविधा प्रकल्प\n\nपुण्याची boom चुकवली? नागपूर आपली पुढची संधी आहे.\n\nDM करा आणि आजच बोलूया. 📩",
    WhatsApp:
      "🏡 *नवीन प्रकल्प लाँच!*\n\nनमस्कार,\nआमचा नवीन RERA मंजूर प्रकल्प लाँच होतोय!\n📍 स्थान: MIHAN जवळ, नागपूर\n💰 किंमत: ₹25 लाखांपासून\n✅ RERA मंजूर | स्वच्छ मालकी\n\nमोफत साइट भेट बुक करण्यासाठी *YES* रिप्लाय करा. 🙏",
    "X (Twitter)":
      "🧵 2026 मध्ये नागपूर रिअल इस्टेटमध्ये गुंतवणूक का करावी:\n\n1/ सर्व मुंबई-पुणे पाहतात, हुशार पैसा नागपूरकडे जातोय.\n\n2/ MIHAN प्रकल्पामुळे 10 लाख+ नोकऱ्या येणार — मागणी वाढणार.\n\n3/ किमती अजून पुण्यापेक्षा 60% कमी आहेत.\n\n4/ RERA मंजूर plots ₹25L पासून. DM करा. 🏡",
    "YouTube Shorts":
      "[HOOK - 0-3s]\nहे शहर पुढचा मोठा रिअल इस्टेट boom पाहील!\n\n[BODY - 3-45s]\n✅ कारण 1: MIHAN — भारतातील सर्वात मोठे SEZ\n✅ कारण 2: किमती अजून पुण्यापेक्षा 60% कमी\n✅ कारण 3: आमचे RERA मंजूर plots फक्त ₹25 लाखांपासून\n\n[CTA - 45-60s]\nBio मध्ये link आहे किंवा आजच call करा!",
    Facebook:
      "माझ्या एका client ने सांगितले:\n'शेअर market मध्ये 10 वर्षे घालवली. एक जमिनीचा तुकडा घेतला — तेव्हापासून शांत झोप लागते.'\n\nजमिनीची गोष्टच वेगळी. 🏡\n\nआमचा नवीन project फक्त ₹25 लाखांपासून — RERA मंजूर, स्वच्छ मालकी.\n\nखाली 'INFO' comment करा आणि संपूर्ण माहिती मिळवा! 👇",
  },
  Hinglish: {
    Instagram:
      "Slide 1: 🚀 Yeh Opportunity Mat Chhodna!\nSlide 2: Har saal 15-20% ki growth\nSlide 3: RERA Approved aur Clear Title — Zero tension ✅\nSlide 4: Sirf ₹25 Lakhs se shuru\n\nCaption: Limited plots hain, jaldi karo! 💫 Aaj hi DM karo. 🏡\n\n#RealEstate #Investment #Nagpur #GharKaSapna",
    LinkedIn:
      "Sab Mumbai aur Bangalore ki baat karte hain.\n\nLekin smart investors pehle sochte hain.\n\nTier-2 cities mein abhi:\n→ 15-20% saalana appreciation\n→ Affordable prices\n→ Bada infrastructure investment\n\nPune ki boom miss ki? Nagpur aapka next chance hai.\n\nDM karo aur aaj hi baat karte hain. 📩\n\n#RealEstateIndia #Investment #Nagpur",
    WhatsApp:
      "🏡 *Naya Project Launch!*\n\nNamaskar,\nHamara naya RERA approved project launch ho raha hai!\n📍 Location: MIHAN ke paas, Nagpur\n💰 Price: ₹25 Lakh se shuru\n✅ RERA Approved | Clear Title\n\nFree site visit book karne ke liye *YES* reply karo. 🙏",
    "X (Twitter)":
      "🧵 2026 mein Nagpur real estate mein invest kyun karein:\n\n1/ Sab Mumbai-Pune dekhte hain, smart paisa Nagpur ja raha hai.\n\n2/ MIHAN project se 10 lakh+ jobs aa rahi hain — demand badhegi.\n\n3/ Abhi prices Pune se 60% kam hain. Yeh gap jyada din nahi rahega.\n\n4/ RERA approved plots ₹25L se. DM karo. 🏡",
    "YouTube Shorts":
      "[HOOK - 0-3s]\nYeh city next bada real estate boom dekhega!\n\n[BODY - 3-45s]\n✅ Reason 1: MIHAN — India ka sabse bada SEZ, 10 lakh jobs aane wali hain\n✅ Reason 2: Prices abhi Pune se 60% kam hain\n✅ Reason 3: Hamare RERA approved plots sirf ₹25 lakh se shuru\n\n[CTA - 45-60s]\nBio mein link hai, ya aaj hi call karo!",
    Facebook:
      "Mere ek client ne kaha:\n'Share market mein 10 saal lagaye. Ek zameen ka tukda khareeda — tab se chain ki neend aati hai.'\n\nZameen ki baat hi alag hoti hai. 🏡\n\nHamara naya project sirf ₹25 lakh se — RERA approved, clear title.\n\nComment 'INFO' neeche aur main aapko full details dunga! 👇\n\n#GharKaSapna #Investment #RealEstate",
  },
};

const MOCK_TAGS: Record<string, string> = {
  English: "#RealEstate #Investment #Nagpur #PropertyInvestment #RERA",
  Hindi: "#रियलएस्टेट #निवेश #नागपुर #RealEstate #Investment",
  Marathi: "#रिअलइस्टेट #गुंतवणूक #नागपूर #RealEstate",
  Hinglish: "#RealEstate #NagpurProperty #Investment #GharKaSapna",
};

const MOCK_TITLES: Record<string, Record<string, string>> = {
  English: {
    Instagram: "Why Invest NOW",
    LinkedIn: "The Tier-2 City Opportunity",
    WhatsApp: "New Project Launch!",
    "X (Twitter)": "Nagpur RE Thread",
    "YouTube Shorts": "3 Reasons to Invest",
    Facebook: "Land vs Stock Market",
  },
  Hindi: {
    Instagram: "अभी निवेश करें!",
    LinkedIn: "टियर-2 शहरों का मौका",
    WhatsApp: "नया प्रोजेक्ट!",
    "X (Twitter)": "नागपुर Thread",
    "YouTube Shorts": "निवेश के 3 कारण",
    Facebook: "ज़मीन vs शेयर",
  },
  Marathi: {
    Instagram: "आत्ताच गुंतवणूक!",
    LinkedIn: "टियर-2 शहरांची संधी",
    WhatsApp: "नवीन प्रकल्प!",
    "X (Twitter)": "नागपूर Thread",
    "YouTube Shorts": "3 कारणे गुंतवणुकीची",
    Facebook: "जमीन vs शेअर",
  },
  Hinglish: {
    Instagram: "Yeh Chance Mat Chhodna!",
    LinkedIn: "Tier-2 Cities ka Mauka",
    WhatsApp: "Naya Project!",
    "X (Twitter)": "Nagpur Thread",
    "YouTube Shorts": "3 Reasons to Invest",
    Facebook: "Zameen vs Share Market",
  },
};

function buildMockPost(platform: string, language: string, idx: number): GeneratedPost {
  const langKey = language in MOCK_BODIES ? language : "English";
  const platKey = platform in MOCK_BODIES[langKey] ? platform : "Instagram";

  return {
    id: `demo_${platform.replace(/\s/g, "_")}_${language}_${idx}`,
    platform,
    type: PLATFORM_TYPES[platform] || "post",
    language,
    title: MOCK_TITLES[langKey]?.[platKey] || `${platform} — ${language}`,
    body: MOCK_BODIES[langKey][platKey] || MOCK_BODIES["English"]["Instagram"],
    tags: MOCK_TAGS[langKey] || MOCK_TAGS["English"],
    cta: platform === "WhatsApp" ? "Reply YES to book a free site visit" : "DM us for details",
    ctaType: platform === "WhatsApp" ? "whatsapp" : "dm",
    notes: `[Demo] ${platform} post in ${language}. Hook-first format chosen for maximum scroll-stopping impact. Add your Gemini API key for real AI-generated content tailored to your brand.`,
  };
}
