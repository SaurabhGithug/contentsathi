export interface QualityScore {
  score: number;
  breakdown: {
    characterCount: number;
    toneScore: number;
    readabilityScore: number;
    hashtagScore: number;
  };
  feedback: string[];
}

const PLATFORM_LIMITS: Record<string, number> = {
  instagram: 2200,
  linkedin: 3000,
  x: 280,
  facebook: 63206,
  whatsapp: 1024,
  youtube: 5000
};

export function analyzeContent(content: string, platform: string, targetTone?: string): QualityScore {
  const platformLower = platform.toLowerCase();
  const limit = PLATFORM_LIMITS[platformLower] || 2000;
  const feedback: string[] = [];

  // 1. Character Count Scoring
  const charCount = content.length;
  let charScore = 100;
  if (charCount > limit) {
    charScore = 0;
    feedback.push(`Content exceeds ${platform} limit of ${limit} characters.`);
  } else if (charCount < 50) {
    charScore = 50;
    feedback.push("Content is very short for this platform.");
  } else if (charCount > limit * 0.9) {
    charScore = 80;
    feedback.push("Content is nearing the platform character limit.");
  }

  // 2. Hashtag Scoring
  const hashtags = (content.match(/#[a-z0-9_]+/gi) || []).length;
  let hashtagScore = 100;
  if (platformLower === 'instagram' && hashtags < 3) {
    hashtagScore = 70;
    feedback.push("Add more hashtags (3-10) for better Instagram reach.");
  } else if (platformLower === 'instagram' && hashtags > 20) {
    hashtagScore = 50;
    feedback.push("Too many hashtags can look like spam on Instagram.");
  } else if (platformLower === 'linkedin' && hashtags > 5) {
      hashtagScore = 60;
      feedback.push("LinkedIn posts perform best with 3-5 hashtags.");
  } else if (platformLower === 'x' && hashtags > 3) {
      hashtagScore = 40;
      feedback.push("Minimize hashtags on X for better readability.");
  }

  // 3. Readability (Basic scan for paragraph breaks)
  const paragraphs = content.split('\n').filter(p => p.trim().length > 0).length;
  let readabilityScore = 100;
  if (paragraphs === 1 && charCount > 300) {
    readabilityScore = 40;
    feedback.push("Break content into smaller paragraphs for better mobile reading.");
  }

  // 4. Tone Simulation (Keyword match)
  let toneScore = 100;
  const realEstateKeywords = ['plot', 'investment', 'amenities', 'location', 'nagpur', 'residential', 'opportunity', 'growth', 'secure', 'future'];
  const matchedKeywords = realEstateKeywords.filter(k => content.toLowerCase().includes(k)).length;
  
  if (matchedKeywords < 2) {
      toneScore = 60;
      feedback.push("Content lacks key real estate industry terminology.");
  }

  // Final average
  const finalScore = Math.round((charScore + hashtagScore + readabilityScore + toneScore) / 4);

  return {
    score: finalScore,
    breakdown: {
      characterCount: charScore,
      toneScore: toneScore,
      readabilityScore: readabilityScore,
      hashtagScore: hashtagScore
    },
    feedback
  };
}
