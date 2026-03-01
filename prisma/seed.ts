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
    // 1. Create Demo User
    const hashedPassword = await bcrypt.hash('Demo@1234', 10);
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@contentsaarthi.in' },
      update: {},
      create: {
        email: 'demo@contentsaarthi.in',
        passwordHash: hashedPassword,
        name: 'Contentsathi',
        planTier: PlanTier.agency,
        creditsBalance: 500,
        onboardingCompleted: true,
      },
    });
    console.log('Demo user created/updated');

    // 2. Create Content Brain for Demo User
    await prisma.contentBrain.upsert({
      where: { userId: demoUser.id },
      update: {},
      create: {
        userId: demoUser.id,
        brandName: 'Saraswati Nagari',
        brandDescription: 'Premium residential plots and township developer in Nagpur focus on high growth corridors.',
        industry: 'Real Estate',
        location: 'Nagpur, Maharashtra',
        audienceDescription: 'Investors looking for high appreciation and families looking for safe residential plots.',
        tone: 'Informative, Trustworthy, and Visionary',
        primaryLanguage: LanguageType.hinglish,
        secondaryLanguage: LanguageType.marathi,
        ctas: ['Call 9876543210', 'Visit site today', 'DM for brochure'],
      },
    });
    console.log('Content brain created/updated');

    // 3. Indian Festival Calendar (2026)
    const festivals = [
      { name: "Makar Sankranti", date: "2026-01-14", 
        nameMarathi: "मकर संक्रांती", nameHindi: "मकर संक्रांति",
        type: "festival", region: "all_india",
        contentAngle: "New beginnings, harvest season, invest in land this Sankranti",
        suggestedTopics: ["New year new home", "Plot booking this Sankranti"],
        urgencyDaysBefore: 5 },

      { name: "Republic Day", date: "2026-01-26",
        type: "holiday", region: "all_india",
        contentAngle: "Pride in India, growth story, real estate as nation building",
        suggestedTopics: ["Invest in India's growth", "Nagpur — India's new growth hub"] },

      { name: "Valentine's Day", date: "2026-02-14",
        type: "celebration", region: "all_india",
        contentAngle: "Gift your family a home, invest in your family's future",
        suggestedTopics: ["Gift your loved ones a plot this Valentine's"] },

      { name: "Gudi Padwa", date: "2026-03-19",
        nameMarathi: "गुढी पाडवा",
        type: "festival", region: "maharashtra",
        contentAngle: "Maharashtrian New Year — perfect time to make new investments",
        suggestedTopics: ["Nava varsha navi suru — plot booking open", "Gudi Padwa special offer"],
        urgencyDaysBefore: 7 },

      { name: "Ram Navami", date: "2026-04-06",
        type: "festival", region: "all_india",
        contentAngle: "Auspicious time for new beginnings",
        suggestedTopics: ["Book your plot on Ram Navami"] },

      { name: "Akshaya Tritiya", date: "2026-04-28",
        nameHindi: "अक्षय तृतीया",
        type: "festival", region: "all_india",
        contentAngle: "Most auspicious day for investments — never-ending prosperity",
        suggestedTopics: ["Invest on Akshaya Tritiya", "Gold vs Land — what to buy today"],
        urgencyDaysBefore: 10 },

      { name: "Maharashtra Day", date: "2026-05-01",
        type: "holiday", region: "maharashtra",
        contentAngle: "Pride in Maharashtra, Nagpur as Maharashtra's second capital",
        suggestedTopics: ["Nagpur — Maharashtra chi shaan", "Why Nagpur is Maharashtra's fastest growing city"] },

      { name: "Independence Day", date: "2026-08-15",
        type: "holiday", region: "all_india",
        contentAngle: "Freedom to own land, invest in India's future",
        suggestedTopics: ["Azadi ka apna ghar", "Own your piece of India"] },

      { name: "Ganesh Chaturthi", date: "2026-08-22",
        nameMarathi: "गणेश चतुर्थी", nameHindi: "गणेश चतुर्थी",
        type: "festival", region: "maharashtra",
        contentAngle: "New beginnings with Ganpati bappa's blessings, auspicious for investment",
        suggestedTopics: ["Ganpati blessing — book your plot", "Ganesh Chaturthi special offer"],
        urgencyDaysBefore: 10 },

      { name: "Navratri", date: "2026-10-09",
        type: "festival", region: "all_india",
        contentAngle: "Power and prosperity, invest during Navratri",
        suggestedTopics: ["Navratri mein nivesh karo", "Devi's blessing on your investment"] },

      { name: "Dussehra", date: "2026-10-19",
        type: "festival", region: "all_india",
        contentAngle: "Victory over obstacles — overcome your hesitation and invest",
        suggestedTopics: ["Dussehra — evil of doubt ko harao, plot book karo"] },

      { name: "Diwali", date: "2026-11-08",
        nameMarathi: "दिवाळी", nameHindi: "दीवाली",
        type: "festival", region: "all_india",
        contentAngle: "Biggest festival — peak real estate buying season in India",
        suggestedTopics: ["Diwali par apna ghar", "Diwali offer — plot at special price", "This Diwali invest in land"],
        urgencyDaysBefore: 21 },

      { name: "Bhau Beej", date: "2026-11-10",
        nameMarathi: "भाऊबीज",
        type: "festival", region: "maharashtra",
        contentAngle: "Brother-sister bond — gift your sister a secure future",
        suggestedTopics: ["Bhau Beej gift — plot booking"] },

      { name: "Christmas", date: "2026-12-25",
        type: "festival", region: "all_india",
        contentAngle: "Year-end investment, gift yourself a new home",
        suggestedTopics: ["Christmas offer on plots", "Year-end investment opportunity"] },

      { name: "New Year Eve", date: "2026-12-31",
        type: "celebration", region: "all_india",
        contentAngle: "Last chance to invest before new year, tax saving investment",
        suggestedTopics: ["2026 mein plot lena tha? Kal last chance", "Tax saving investment before year end"],
        urgencyDaysBefore: 7 }
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
        distanceHighway: "2 km"
      },
      {
        name: "Hingna Road",
        zone: "west",
        connectedTo: ["Ring Road 1km", "Nagpur-Mumbai Highway 3km", "MIDC Industrial Area 2km"],
        schools: ["Vidya Niketan", "New English School", "Priyadarshini College"],
        hospitals: ["Lata Mangeshkar Hospital", "Shalinitai Meghe Hospital"],
        malls: ["VR Nagpur (Trillium)", "Fortune Mall"],
        upcomingInfra: ["Metro Phase 2 — Hingna corridor", "MIDC expansion", "New IT Park Hingna"],
        avgPlotPriceMin: 1200,
        avgPlotPriceMax: 2500,
        appreciationYoY: "15-22%",
        distanceAirport: "12 km",
        distanceRailway: "10 km",
        distanceHighway: "1 km"
      },
      {
          name: "Mihan",
          zone: "south",
          connectedTo: ["Wardha Road 1km", "Samruddhi Mahamarg 5km", "Airport 8km"],
          schools: ["DY Patil International", "Mount Litera Zee School"],
          hospitals: ["AIIMS Nagpur", "National Cancer Institute"],
          malls: ["Proposed MIHAN Mall"],
          upcomingInfra: ["Infosys Phase 2", "HCL expansion", "Dassault Aviation expansion"],
          avgPlotPriceMin: 1500,
          avgPlotPriceMax: 3500,
          appreciationYoY: "25-30%",
          distanceAirport: "8 km",
          distanceRailway: "15 km",
          distanceHighway: "1 km"
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
