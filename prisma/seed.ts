import 'dotenv/config';
import { PrismaClient, PlanTier, LanguageType, UrgencyLevel, PlatformType, PostStatus, AssetType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Starting seed...');

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for seeding.");
  }

  const pool = new pg.Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Create Demo Users
    const hashedPassword = bcrypt.hashSync('Demo@1234', 10);
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@contentsathi.in' },
      update: {},
      create: {
        email: 'demo@contentsathi.in',
        passwordHash: hashedPassword,
        name: 'Saurabh Demo',
        planTier: PlanTier.creator,
        creditsBalance: 5000,
        onboardingCompleted: true,
      },
    });
    console.log('Demo user created/updated');

    const devPassword = bcrypt.hashSync('password123', 10);
    const devUser = await prisma.user.upsert({
      where: { email: 'saurabh@example.com' },
      update: {
        passwordHash: devPassword,
      },
      create: {
        email: 'saurabh@example.com',
        passwordHash: devPassword,
        name: 'Saurabh (Dev Admin)',
        planTier: PlanTier.agency,
        creditsBalance: 999999,
        onboardingCompleted: true,
      },
    });
    console.log('Dev user (saurabh@example.com) created/updated');

    // 2. Create Content Brain for Demo User
    await prisma.contentBrain.upsert({
      where: { userId: demoUser.id },
      update: {
        brandName: "Saraswati Nagari",
        brandDescription: "Premium residential plots near upcoming infrastructure in Nagpur. RERA approved. Ideal for investors and first-time homebuyers.",
        industry: "Real Estate & Land Development",
        location: "Nagpur, Maharashtra",
        audienceDescription: "Investors, IT professionals, first-time homebuyers, NRIs from Nagpur region",
        tone: "warm_trustworthy",
        primaryLanguage: LanguageType.marathi,
        secondaryLanguage: LanguageType.hinglish,
        ctas: {
          primary: "WhatsApp us for site visit booking",
          secondary: "Call now for best price",
          emergency: "Only 5 plots remaining — book today"
        },
        contactPhone: "+919999999999",
        contactEmail: "info@saraswatinagari.in",
        contactWebsite: "https://saraswatinagari.in"
      },
      create: {
        userId: demoUser.id,
        brandName: "Saraswati Nagari",
        brandDescription: "Premium residential plots near upcoming infrastructure in Nagpur. RERA approved. Ideal for investors and first-time homebuyers.",
        industry: "Real Estate & Land Development",
        location: "Nagpur, Maharashtra",
        audienceDescription: "Investors, IT professionals, first-time homebuyers, NRIs from Nagpur region",
        tone: "warm_trustworthy",
        primaryLanguage: LanguageType.marathi,
        secondaryLanguage: LanguageType.hinglish,
        ctas: {
          primary: "WhatsApp us for site visit booking",
          secondary: "Call now for best price",
          emergency: "Only 5 plots remaining — book today"
        },
        contactPhone: "+919999999999",
        contactEmail: "info@saraswatinagari.in",
        contactWebsite: "https://saraswatinagari.in"
      },
    });
    console.log('Content brain created/updated');

    // 3. Indian Festival Calendar (2026)
    const festivals = [
      { 
        name: "Makar Sankranti", date: "2026-01-14", 
        nameMarathi: "मकर संक्रांती", nameHindi: "मकर संक्रांति", type: "festival", region: "all_india",
        contentAngle: "New beginnings, harvest season, invest in land this Sankranti",
        suggestedTopics: ["New year new home", "Plot booking this Sankranti"],
        urgencyDaysBefore: 5 
      },
      { 
        name: "Republic Day", date: "2026-01-26", type: "holiday", region: "all_india",
        contentAngle: "Pride in India, growth story, real estate as nation building",
        suggestedTopics: ["Invest in India's growth", "Nagpur — India's new growth hub"] 
      },
      { 
        name: "Valentine's Day", date: "2026-02-14", type: "celebration", region: "all_india",
        contentAngle: "Gift your family a home, invest in your family's future",
        suggestedTopics: ["Gift your loved ones a plot this Valentine's"] 
      },
      { 
        name: "Gudi Padwa", date: "2026-03-19", 
        nameMarathi: "गुढी पाडवा", type: "festival", region: "maharashtra",
        contentAngle: "Maharashtrian New Year — perfect time to make new investments",
        suggestedTopics: ["Nava varsha navi suru — plot booking open", "Gudi Padwa special offer"],
        urgencyDaysBefore: 7 
      },
      { 
        name: "Ram Navami", date: "2026-04-06", type: "festival", region: "all_india",
        contentAngle: "Auspicious time for new beginnings",
        suggestedTopics: ["Book your plot on Ram Navami"] 
      },
      { 
        name: "Akshaya Tritiya", date: "2026-04-28", 
        nameHindi: "अक्षय तृतीया", type: "festival", region: "all_india",
        contentAngle: "Most auspicious day for investments — never-ending prosperity",
        suggestedTopics: ["Invest on Akshaya Tritiya", "Gold vs Land — what to buy today"],
        urgencyDaysBefore: 10 
      },
      { 
        name: "Maharashtra Day", date: "2026-05-01", type: "holiday", region: "maharashtra",
        contentAngle: "Pride in Maharashtra, Nagpur as Maharashtra's second capital",
        suggestedTopics: ["Nagpur — Maharashtra chi shaan", "Why Nagpur is Maharashtra's fastest growing city"] 
      },
      { 
        name: "Independence Day", date: "2026-08-15", type: "holiday", region: "all_india",
        contentAngle: "Freedom to own land, invest in India's future",
        suggestedTopics: ["Azadi ka apna ghar", "Own your piece of India"] 
      },
      { 
        name: "Ganesh Chaturthi", date: "2026-08-22", 
        nameMarathi: "गणेश चतुर्थी", nameHindi: "गणेश चतुर्थी", type: "festival", region: "maharashtra",
        contentAngle: "New beginnings with Ganpati bappa's blessings, auspicious for investment",
        suggestedTopics: ["Ganpati blessing — book your plot", "Ganesh Chaturthi special offer"],
        urgencyDaysBefore: 10 
      },
      { 
        name: "Navratri", date: "2026-10-09", type: "festival", region: "all_india",
        contentAngle: "Power and prosperity, invest during Navratri",
        suggestedTopics: ["Navratri mein nivesh karo", "Devi's blessing on your investment"] 
      },
      { 
        name: "Dussehra", date: "2026-10-19", type: "festival", region: "all_india",
        contentAngle: "Victory over obstacles — overcome your hesitation and invest",
        suggestedTopics: ["Dussehra — evil of doubt ko harao, plot book karo"] 
      },
      { 
        name: "Diwali", date: "2026-11-08", 
        nameMarathi: "दिवाळी", nameHindi: "दीवाली", type: "festival", region: "all_india",
        contentAngle: "Biggest festival — peak real estate buying season in India",
        suggestedTopics: ["Diwali par apna ghar", "Diwali offer — plot at special price", "This Diwali invest in land"],
        urgencyDaysBefore: 21 
      },
      { 
        name: "Bhau Beej", date: "2026-11-10", 
        nameMarathi: "भाऊबीज", type: "festival", region: "maharashtra",
        contentAngle: "Brother-sister bond — gift your sister a secure future",
        suggestedTopics: ["Bhau Beej gift — plot booking"] 
      },
      { 
        name: "Christmas", date: "2026-12-25", type: "festival", region: "all_india",
        contentAngle: "Year-end investment, gift yourself a new home",
        suggestedTopics: ["Christmas offer on plots", "Year-end investment opportunity"] 
      },
      { 
        name: "New Year Eve", date: "2026-12-31", type: "celebration", region: "all_india",
        contentAngle: "Last chance to invest before new year, tax saving investment",
        suggestedTopics: ["2026 mein plot lena tha? Kal last chance", "Tax saving investment before year end"],
        urgencyDaysBefore: 7 
      }
    ];

    for (const f of festivals) {
      await prisma.festivalCalendar.upsert({
        where: { name_year: { name: f.name, year: 2026 } },
        update: {},
        create: {
          name: f.name,
          nameMarathi: f.nameMarathi,
          nameHindi: f.nameHindi,
          date: new Date(f.date),
          year: 2026,
          type: f.type,
          region: f.region,
          contentAngle: f.contentAngle,
          suggestedTopics: f.suggestedTopics,
          urgencyDaysBefore: f.urgencyDaysBefore || 3,
        },
      });
    }
    console.log('Festivals seeded');

    // 4. Nagpur Locality Data
    const nagpurLocalities = [
      {
        name: "Wardha Road",
        zone: "south-east",
        connectedTo: ["Airport 15km", "Railway Station 12km", "MIHAN 5km", "Ring Road 2km"],
        schools: ["DPS Nagpur", "Somalwar School", "Bharat English School"],
        hospitals: ["Alexis Hospital", "AIIMS Nagpur 8km", "Wockhardt Hospital"],
        malls: ["Empress Mall 8km", "South Avenue Mall"],
        upcomingInfra: ["Metro Phase 2 — Wardha Road corridor", "MIHAN IT SEZ expansion", "International airport terminal upgrade"],
        avgPlotPriceMin: 800,
        avgPlotPriceMax: 1800,
        appreciationYoY: "18-25%",
        distanceAirport: "15 km",
        distanceRailway: "12 km",
        distanceHighway: "2 km",
        priceUnit: "per_sqft"
      },
      {
        name: "Hingna Road",
        zone: "west",
        connectedTo: ["Ring Road 1km", "Nagpur-Mumbai Highway 3km", "MIDC Industrial Area 2km"],
        schools: ["Vidya Niketan", "New English School", "Saraswati Vidyalaya"],
        hospitals: ["Orange City Hospital 6km", "Care Hospital 8km", "Hingna Primary Health Centre"],
        malls: ["Poonam Mall 5km", "Empress Mall 10km"],
        upcomingInfra: ["Ring Road Phase 2 widening", "MIDC Hingna expansion", "Proposed logistics park"],
        avgPlotPriceMin: 500,
        avgPlotPriceMax: 900,
        appreciationYoY: "12-18%",
        distanceAirport: "20 km",
        distanceRailway: "10 km",
        distanceHighway: "3 km",
        priceUnit: "per_sqft"
      },
      {
        name: "Katol Road",
        zone: "north",
        connectedTo: ["NH-44 4km", "Railway Station 8km", "Nagpur University 5km", "Civil Lines 6km"],
        schools: ["Bhonsala Military School", "Hislop College 5km", "Diocese School"],
        hospitals: ["Government Medical College 7km", "Lata Mangeshkar Hospital 6km", "Wockhardt Hospital 8km"],
        malls: ["Poonam Mall 4km", "Lokmat Square 5km"],
        upcomingInfra: ["Metro Line 2 — Katol Road station", "North Nagpur IT corridor", "Smart City project zone"],
        avgPlotPriceMin: 600,
        avgPlotPriceMax: 1100,
        appreciationYoY: "14-20%",
        distanceAirport: "18 km",
        distanceRailway: "8 km",
        distanceHighway: "4 km",
        priceUnit: "per_sqft"
      },
      {
        name: "Kamptee Road",
        zone: "north-east",
        connectedTo: ["NH-7 2km", "Railway Station 10km", "Kamptee Cantonment 5km", "Outer Ring Road 3km"],
        schools: ["Army Public School", "St. Francis School", "Kendriya Vidyalaya Kamptee"],
        hospitals: ["Military Hospital Kamptee", "Orange City Hospital 12km", "NMC Hospital 8km"],
        malls: ["Empress Mall 11km", "Trimurti Mall 6km"],
        upcomingInfra: ["Outer Ring Road connectivity", "Proposed defence corridor", "Kamptee bypass road"],
        avgPlotPriceMin: 400,
        avgPlotPriceMax: 750,
        appreciationYoY: "10-15%",
        distanceAirport: "22 km",
        distanceRailway: "10 km",
        distanceHighway: "2 km",
        priceUnit: "per_sqft"
      },
      {
        name: "Amravati Road",
        zone: "west",
        connectedTo: ["NH-53 1km", "Ring Road 2km", "Nagpur Railway Station 7km", "Airport 16km"],
        schools: ["DPS Amravati Road", "Podar International School", "Shantiniketan School"],
        hospitals: ["Alexis Hospital 4km", "Spandan Hospital", "Getwell Hospital"],
        malls: ["South Avenue Mall 3km", "Poonam Mall 6km"],
        upcomingInfra: ["Metro Phase 2 — Amravati Road corridor", "Proposed IT park near Ring Road", "Flyover at Nari Ring Road junction"],
        avgPlotPriceMin: 700,
        avgPlotPriceMax: 1400,
        appreciationYoY: "16-22%",
        distanceAirport: "16 km",
        distanceRailway: "7 km",
        distanceHighway: "1 km",
        priceUnit: "per_sqft"
      },
      {
        name: "Butibori MIDC",
        zone: "south-west",
        connectedTo: ["NH-44 1km", "Nagpur-Hyderabad Highway", "Airport 30km", "Nagpur Railway Station 25km"],
        schools: ["MIDC School", "Zilla Parishad School"],
        hospitals: ["Butibori Primary Health Centre", "Alexis Hospital 20km"],
        malls: [],
        upcomingInfra: ["MIDC Phase 3 industrial expansion", "Proposed workers township", "Logistics hub near highway", "Warehousing and e-commerce zone"],
        avgPlotPriceMin: 250,
        avgPlotPriceMax: 500,
        appreciationYoY: "15-20% (industrial proximity premium)",
        distanceAirport: "30 km",
        distanceRailway: "25 km",
        distanceHighway: "1 km",
        priceUnit: "per_sqft"
      }
    ];

    for (const l of nagpurLocalities) {
      await prisma.nagpurLocality.upsert({
        where: { name: l.name },
        update: {},
        create: l,
      });
    }
    console.log('Localities seeded');

    // 5. Default Templates
    const defaultTemplates = [
      { name: "New Project Announcement", category: "real_estate_listing", description: "Announce a new plot or flat project with all key details", inputSchema: { projectName: "string", location: "string", startingPrice: "string", plotSizes: "string", usps: "string", reraNumber: "string", possessionDate: "string" }, defaultPlatformTargets: ["instagram", "facebook", "whatsapp", "linkedin"], promptSnippet: "Create a new project announcement for {projectName} located at {location}. Starting price {startingPrice}. Plot sizes: {plotSizes}. Key USPs: {usps}. RERA: {reraNumber}. Possession by {possessionDate}." },
      { name: "Price Revision / Offer", category: "price_announcement", description: "Announce a price increase or limited time offer", inputSchema: { projectName: "string", oldPrice: "string", newPrice: "string", deadline: "string", reason: "string" }, defaultPlatformTargets: ["instagram", "whatsapp", "facebook"], promptSnippet: "Announce price revision for {projectName}. Current price {oldPrice} going up to {newPrice} from {deadline}. Reason: {reason}. Create urgency without being pushy." },
      { name: "Educational Post — RERA", category: "educational", description: "Educate buyers about RERA and why it protects them", inputSchema: { angle: "string", localContext: "string" }, defaultPlatformTargets: ["instagram", "linkedin", "youtube"], promptSnippet: "Write an educational post about RERA for first-time plot buyers in Maharashtra. Angle: {angle}. Local context: {localContext}. Make it simple, trustworthy, not salesy." },
      { name: "Property Walkthrough Script", category: "video_script", description: "Script for a video walkthrough of a plot or property", inputSchema: { projectName: "string", location: "string", highlights: "string", surroundings: "string", priceRange: "string" }, defaultPlatformTargets: ["youtube", "instagram"], promptSnippet: "Write a 60-second YouTube Shorts walkthrough script for {projectName} at {location}. Highlights: {highlights}. Surroundings: {surroundings}. Price: {priceRange}. Hook in first 3 seconds. End with strong site visit CTA." },
      { name: "Local Area Guide", category: "locality_guide", description: "Showcase the area around a project — schools, hospitals, connectivity", inputSchema: { areaName: "string", projectName: "string", keyPlaces: "string", infrastructure: "string" }, defaultPlatformTargets: ["instagram", "linkedin", "facebook"], promptSnippet: "Create a local area guide post for {areaName} near {projectName}. Nearby places: {keyPlaces}. Infrastructure: {infrastructure}. Show why this location is perfect for families." },
      { name: "Investor ROI Post", category: "investment_pitch", description: "Show investment returns and appreciation potential", inputSchema: { projectName: "string", currentPrice: "string", expectedAppreciation: "string", timeframe: "string", comparisons: "string" }, defaultPlatformTargets: ["linkedin", "instagram", "whatsapp"], promptSnippet: "Write an investor-focused post for {projectName}. Current price {currentPrice}. Expected appreciation {expectedAppreciation} in {timeframe}. Compare with {comparisons} as alternative investments. Target audience: investors aged 30-50." },
      { name: "Testimonial Story", category: "social_proof", description: "Turn a customer success story into a compelling post", inputSchema: { customerName: "string", customerBackground: "string", whatTheyBought: "string", theirResult: "string", quote: "string" }, defaultPlatformTargets: ["instagram", "whatsapp", "facebook"], promptSnippet: "Write a testimonial story post about {customerName} — {customerBackground}. They bought {whatTheyBought}. Their result: {theirResult}. Their quote: {quote}. Make it feel like a real human story, not a fake ad." },
      { name: "Festival / Season Offer", category: "festival_campaign", description: "Create a festive-themed offer post", inputSchema: { festivalName: "string", offerDetails: "string", deadline: "string", projectName: "string", contactNumber: "string" }, defaultPlatformTargets: ["instagram", "whatsapp", "facebook", "x"], promptSnippet: "Create a {festivalName} special offer post for {projectName}. Offer: {offerDetails}. Valid till {deadline}. Contact: {contactNumber}. Festive tone, celebratory energy, clear urgency." }
    ];

    for (const t of defaultTemplates) {
      await prisma.generatedAsset.create({
        data: {
          userId: demoUser.id,
          type: AssetType.post,
          templateName: t.name,
          title: t.name,
          body: t.promptSnippet,
          isCustomTemplate: true,
          templateVariables: t.inputSchema,
          notes: t.description,
          tags: [t.category]
        }
      });
    }
    console.log('Templates seeded');

    console.log('Seed completed successfully');
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
