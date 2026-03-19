export type ValuationRequest = {
  // Location
  location: string;          // e.g. "near Somalwada, Wardha Road, Nagpur"
  corridor?: string;         // detected or provided: "Wardha Road"
  city?: string;             // default: "Nagpur"

  // Plot
  areaSqFt?: number;         // e.g. 1500
  areaRaw?: string;          // raw string if sqft not parsed: "200 sq meters"
  frontageRoad?: string;     // e.g. "40 ft facing 60 ft main road"
  isCornerPlot?: boolean;
  shape?: string;            // "Rectangular" | "Irregular" | "L-shaped"
  utilities?: string;        // raw description of utilities
  zoning?: string;           // e.g. "Residential"
  titleStatus?: string;      // e.g. "Clear title, RERA registered"
  nearbyDevelopments?: string;

  // Selectively provided
  userQuery: string;         // the original free-text prompt from the user
};

const VALUATION_KEYWORDS = [
  "value estimate", "land value", "plot value", "valuation", "worth",
  "price for plot", "how much", "market rate", "per sqft", "sqft rate",
  "fast sell", "quick sell", "fast selling", "sell this plot",
  "estimate karo", "kitna milega", "price kya hai", "market mein kitna",
  "land ka rate", "plot ka rate", "zameen ka rate",
  "fair price", "selling price", "what is the price",
];

export function isValuationIntent(message: string): boolean {
  const lower = message.toLowerCase();
  // Must mention something property/plot/land related
  const hasPropertyRef = [
    "plot", "land", "zameen", "sqft", "sq ft", "gunta", "acres",
    "property", "site", "layout", "develop",
  ].some(kw => lower.includes(kw));

  const hasValuationRef = VALUATION_KEYWORDS.some(kw => lower.includes(kw));

  return hasPropertyRef && hasValuationRef;
}

export function parsePlotFromMessage(message: string): Partial<ValuationRequest> {
  const lower = message.toLowerCase();

  // Area parsing
  let areaSqFt: number | undefined;
  const sqftMatch = message.match(/(\d[\d,]*\.?\d*)\s*(?:sq\.?\s*ft|sqft)/i);
  const sqyMatch  = message.match(/(\d[\d,]*\.?\d*)\s*(?:sq\.?\s*yd|sq yard|square yard)/i);
  const sqmMatch  = message.match(/(\d[\d,]*\.?\d*)\s*(?:sq\.?\s*m|sqm|square meter)/i);
  const guntaMatch = message.match(/(\d[\d,]*\.?\d*)\s*(?:gunta|guntha)/i);
  const acreMatch = message.match(/(\d[\d,]*\.?\d*)\s*acre/i);

  if (sqftMatch) areaSqFt = parseFloat(sqftMatch[1].replace(/,/g, ""));
  else if (sqyMatch) areaSqFt = parseFloat(sqyMatch[1].replace(/,/g, "")) * 9;
  else if (sqmMatch) areaSqFt = parseFloat(sqmMatch[1].replace(/,/g, "")) * 10.764;
  else if (guntaMatch) areaSqFt = parseFloat(guntaMatch[1].replace(/,/g, "")) * 1089;
  else if (acreMatch) areaSqFt = parseFloat(acreMatch[1].replace(/,/g, "")) * 43560;

  // Corridor detection
  const corridorMap: Record<string, string> = {
    "wardha": "Wardha Road",
    "mihan": "MIHAN / SEZ",
    "besa": "Besa",
    "ring road": "Ring Road",
    "hingna": "Hingna Road",
    "saraswati": "Saraswati Nagri",
    "godni": "Godni",
    "katol": "Katol Road",
    "umred": "Umred Road",
    "khamla": "Khamla",
    "dharampeth": "Dharampeth",
    "sitabuldi": "Sitabuldi",
    "itwari": "Itwari",
  };
  let corridor: string | undefined;
  for (const [key, label] of Object.entries(corridorMap)) {
    if (lower.includes(key)) { corridor = label; break; }
  }

  // Shape
  let shape: string | undefined;
  if (lower.includes("rectangular") || lower.includes("regular")) shape = "Rectangular";
  else if (lower.includes("irregular") || lower.includes("l-shape")) shape = "Irregular";
  else if (lower.includes("corner")) shape = "Corner";

  // Corner plot
  const isCornerPlot = lower.includes("corner plot") || lower.includes("corner site");

  return { areaSqFt, corridor, shape, isCornerPlot, userQuery: message };
}
