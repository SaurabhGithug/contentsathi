# Plot Value Primer — ContentSathi Knowledge Base

> **Scope:** This document is the authoritative reference for all agents (Gravity Claw, Research Specialist, Copywriter, QC Auditor) when producing content or analysis related to land/plot valuation in India, with specific calibration for Nagpur / NMRDA markets.
>
> **Last updated:** March 2026 · Source: Founder knowledge input
>
> **Comparable Data Source:** Comps are automatically scraped from 99acres, MagicBricks, Housing.com, and local developer websites. They are stored in the `plot_comparables` database table and surfaced via `/api/plot-valuator/comps`. Agents access this data through the Plot Valuator tool, NOT by manually entering comps.

---

## 1. Core Principles (Why Prices Move)

Every agent MUST internalise these principles before generating valuation-related content or analysis:

| Principle | Agent Application |
|-----------|------------------|
| **Scarcity & Location** | Land is finite — emphasise corridor scarcity (e.g. "Only 3 NMRDA-approved plots left on this stretch of Ring Road") |
| **Highest & Best Use** | Mention potential: residential, mixed-use, or commercial rezoning possibilities drive premium |
| **Demand vs Supply** | Use Market Hunt data to surface demand signals (buyer enquiries on 99acres, forum questions) |
| **Access & Utilities** | Always mention water supply, sewage line, road quality, electricity status — these are NEGOTIATING POINTS |
| **Regulatory Framework** | RERA number + NMRDA sanction + EC (Encumbrance Certificate) = the trust trifecta. Never skip. |
| **Development Potential** | Rezoning value, FSI uplift, TDR (Transfer of Development Rights) are premium triggers for investor content |
| **Time Value & Risk Premium** | "Investing in real estate involves risk" — mandatory disclosure on all ROI-forward content |
| **Market Comparables** | Always anchor value claims to verifiable recent sales — "based on transactions registered in [corridor] in Q1 2026" |

---

## 2. Valuation Methods — Agent Reference

### Method 1: Sales Comparison (PRIMARY — use this first for all plots)

```
Value = (Adjusted ₹ per sq ft across comps) × Plot Area

Adjusted ₹/sqft = Avg Comp ₹/sqft × (1 + sum of all adjustment %)
```

**Steps:**
1. Find 2–5 recently sold/listed comparable plots (same corridor, similar size)
2. Convert each to ₹/sqft
3. Apply positive and negative adjustments (see Section 4)
4. Average the adjusted ₹/sqft values
5. Multiply by the subject plot area
6. Express as a range: point estimate ± 8–10%

**When agents use this:** Copywriter should use comp-anchored language in all investment content. Research Specialist should pull live comp data from 99acres/MagicBricks during Market Hunt.

---

### Method 2: Cost Approach (for growth corridor development feasibility)

```
Land Value = Projected Finished Property Value − Development Cost − Developer Profit Margin
```

**Use case:** When writing content for buyers/builders planning immediate development (MIHAN SEZ belt, Ring Road commercial).

---

### Method 3: Income Approach (for leased / revenue-generating plots)

```
Land Value = Annual Net Income / Cap Rate
```

**Use case:** Rare for bare plots. Apply when writing about plots leased to petrol bunks, temporary structures, or solar farms. Always mention yield and cap rate range.

---

### Method 4: Development Potential / Rezoning Premium

```
Uplift Value = PV(Higher-Use Revenue) − PV(Current-Use Revenue)
```

**Use case:** Content about plots that could be rezoned from residential to commercial, or FSI bonuses from upcoming NMRDA Development Plan revisions.

Agent note: Always say "subject to local zoning approval" — do not imply guaranteed rezoning.

---

### Method 5: Per-Unit Rule-of-Thumb Benchmarks

Use corridor-specific ₹/sqft ranges (from Section 5 below) as sanity checks. Never cite a price without cross-referencing against the corridor benchmark.

---

## 3. Adjustment Factor Reference Table

| Factor | Adjustment | Direction | Agent Content Angle |
|--------|-----------|-----------|---------------------|
| Road-facing plot | +5% | Positive | "Direct main road access — no shared lane, no dead-end risk" |
| Corner plot | +8% | Positive | "Double frontage — dual entry, higher visibility, better resale" |
| Metro / Airport < 2 km | +12% | Positive | "Metro catchment zone — rental demand + capital appreciation" |
| MIHAN / SEZ belt | +15% | Positive | "SEZ logistics premium — industrial + residential demand amplifier" |
| Ring Road proximity | +10% | Positive | "Ring Road corridor — city-bypass connectivity, freight efficiency" |
| North / East facing | +3% | Positive | "Preferred orientation — better natural light, lower cooling costs" |
| Wide frontage > 30 ft | +6% | Positive | "Commercial frontage value — retail-ready, bank-mortgageable" |
| School / Hospital belt | +5% | Positive | "Family zone premium — constant demand from end-users" |
| Irregular shape | −8% | Negative | "Usable area loss — construction costs increase by ~12–15%" |
| Waterlogging risk | −12% | Negative | "Monsoon liability — NMRDA drainage plan verification needed" |
| Encumbrance / Title issue | −20% | Negative | "Legal drag — clear EC mandatory before any offer" |
| No water / sewage | −6% | Negative | "Infrastructure gap — add ₹200–400/sqft correction to budget" |
| Interior / non-road plot | −10% | Negative | "Access risk — depends on easement rights and shared paths" |
| Flood zone / Nala adjacent | −15% | Negative | "Nala adjacency — NMRDA building restriction + monsoon risk" |

---

## 4. Key Plot-Specific Due Diligence Checklist

Agents MUST surface these when writing educational or investor content:

### Title & Legal
- [ ] 7/12 extract (Satbara) — verify ownership chain
- [ ] Encumbrance Certificate (EC) — 15 years minimum
- [ ] RERA registration number (for plotted developments)
- [ ] NMRDA / NRDA layout sanction letter
- [ ] NA (Non-Agricultural) order if applicable
- [ ] No litigation, mortgage, or attachment orders

### Physical Site
- [ ] Regular vs irregular shape (impacts FAR/FSI utilisation)
- [ ] Road frontage width (< 12 ft = building permission risk)
- [ ] NMRDA-maintained road or private approach road
- [ ] Water connection: NMRDA scheme / borewell / tanker dependent
- [ ] Electrical connection: MSEDCL metered or pending
- [ ] Drainage: connected to municipal drain or open natural drain

### Financial
- [ ] Circle Rate (Ready Reckoner Rate) for the locality
- [ ] Stamp Duty: 6% (male), 4% (female), 5% (joint) — Maharashtra
- [ ] Registration charges: 1% of market value (max ₹30,000)
- [ ] Property tax slab (NMRDA / NMC zone)

---

## 5. Nagpur Corridor Benchmarks (FY 2025–26)

> These are indicative ranges based on registered transactions and portal listings. Verify against current 99acres / MagicBricks / Sub-Registrar data before citing in content.

| Corridor | Circle Rate (₹/sqft) | Market Rate (₹/sqft) | YoY Appreciation | Market Multiplier | Hot? |
|----------|----------------------|----------------------|------------------|-------------------|------|
| Wardha Road | 3,200 | 3,776–4,500 | +12% | 1.18× | 🔥 |
| Besa / Pipla | 2,400 | 2,928–4,000 | +9% | 1.22× | — |
| MIHAN / SEZ | 2,800 | 3,780–4,500 | +21% | 1.35× | 🔥 |
| Ring Road | 3,000 | 3,750–4,200 | +15% | 1.25× | 🔥 |
| Hingna Road | 1,800 | 2,070–3,000 | +7% | 1.15× | — |
| Saraswati Nagri | 2,200 | 2,816–3,500 | +18% | 1.28× | 🔥 |
| Godni | 1,600 | 1,792–2,200 | +5% | 1.12× | — |
| Katol Road | 2,000 | 2,400–3,500 | +8–10% | 1.20× | — |
| Umred Road | 1,500 | 1,725–2,500 | +15–18% | 1.15× | — |
| Ghoti (Wardha) | 800 | 960–1,500 | +20–25% | 1.20× | 🌱 Emerging |

**Market multiplier** = average of (market rate / circle rate) from recent portal data.

---

## 6. Illustrative Valuation Example (Agents: use this format)

**Subject Plot:** 1,000 sq ft, MIHAN corridor, road-facing, near SEZ gate, slightly irregular shape.

**Comparables:**
- Comp 1: 1,200 sqft, MIHAN road-facing → ₹3,800/sqft (adjust −5% for larger size) = ₹3,610
- Comp 2: 900 sqft, MIHAN interior → ₹3,400/sqft (adjust +8% road-facing premium not applicable) = ₹3,400
- Comp Avg: ₹3,505/sqft

**Plot-Specific Adjustments:**
- Road-facing: +5%
- MIHAN/SEZ belt: +15%
- Irregular shape: −8%
- Net: +12%

**Subject ₹/sqft:** ₹3,505 × 1.12 = ₹3,926

**Estimated Value:** ₹3,926 × 1,000 = **₹39.26 L**
**Value Range:** ₹36.1 L – ₹43.2 L (±8/10%)

**Stamp Duty (5% joint):** ₹1.96 L
**Registration:** ₹30,000 (capped)
**Total Transaction Cost:** ~₹41.6 L all-in

---

## 7. Nagpur-Specific Compliance Notes (Always Apply)

### Circle Rate & Stamp Duty
- Circle Rate = minimum declared value for stamp duty purposes
- **Not** the negotiated market price (which is usually 15–35% above circle rate)
- Understating transaction value to reduce stamp duty = legal risk (Section 47A, Registration Act)
- FY 2025–26 Maharashtra stamp duty: **6% (male)**, **5% (joint)**, **4% (female)** + 1% registration

### RERA
- Plotted development projects > 500 sqm = mandatory RERA registration
- Always check: **https://maharera.mahaonline.gov.in**
- Forbidden content: "RERA-approved plot" without the actual registration number
- Required disclosure: RERA number in format `P51700XXXXXX`

### NMRDA / NRDA Layout Approval
- Nagpur Metro Region Development Authority governs peri-urban layouts
- NMRDA-sanctioned layouts command 10–15% premium over unsanctioned ones
- Verify via: **nmrda.gov.in** → Sanctioned Layouts section

### Ready Reckoner Rate (RRR)
- Published annually by Maharashtra government (March/April)
- Used as floor for stamp duty + any capital gains computation
- Monitor: If market price approaches RRR → "Last Chance" content signal

---

## 8. Agent-Specific Usage Rules

### Gravity Claw (Orchestrator)
- Inject corridor ₹/sqft benchmarks into Research Specialist brief when goal mentions "plot value", "pricing", "valuation", or "investment thesis"
- Flag any content that cites a ROI % without a "past performance" disclaimer

### Research Specialist
- When Market Hunt pulls 99acres/MagicBricks data: extract ₹/sqft by corridor and compare against Section 5 benchmarks
- Flag any listing priced > 15% above the market rate column — likely aspirational pricing, not comp-grade

### Copywriter
- Use adjustment factor language from Section 3 as content angles (e.g. "Corner plot advantage" = headline hook)
- Never write "land prices guaranteed to rise by X%" — use "historical data shows X% annual appreciation in [corridor]"
- Embed valuation logic as educational hooks: "Here's how to know if a plot is fairly priced…"

### QC Auditor
- Reject any content that claims specific ROI %, guaranteed returns, or "assured appreciation" without disclosure
- Flag unanchored price claims (e.g. "prices will double in 2 years") — replace with corridor-specific historical data from Section 5
- Approve content that uses the "historical data shows" / "based on registered transactions" framing

---

## 9. Content Hooks from Valuation Logic

Ready-to-use content angles derived from this primer:

1. **"The 8-Factor Test Before You Buy a Plot in Nagpur"** → Adjustment factor checklist as carousel
2. **"Why MIHAN Plots Cost 35% More Than Circle Rate"** → Infrastructure uplift explainer
3. **"The Comp Method: How Smart Investors Price Nagpur Land"** → Sales comparison walkthrough
4. **"Stamp Duty Calculator for Nagpur Plots"** → Tool-style Instagram content
5. **"Circle Rate vs Market Rate: What No One Tells You"** → Trust-building educational post
6. **"Red Flags in a Plot Sale: EC, 7/12, and RERA — What to Check"** → Due diligence checklist
7. **"Ready Reckoner 2025–26: Which Corridors Got the Biggest Rate Hike?"** → Market analysis
8. **"Corner Plot Math: When the Premium Is Worth It"** → Data-driven content for investors

---

*This document is a living knowledge base. Update Section 5 benchmark data quarterly when new RRR rates or portal data is available.*
