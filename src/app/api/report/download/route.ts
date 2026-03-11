import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/report/download
 * Generates a downloadable HTML-formatted report that can be printed to PDF
 * Returns the full HTML content for the report
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { report } = body;

    if (!report) {
      return NextResponse.json({ error: "Report data required" }, { status: 400 });
    }

    const htmlContent = generateReportHTML(report);

    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="ContentSathi-AI-Real-Estate-Report-2026.html"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateReportHTML(report: any): string {
  const { title, subtitle, publisher, publishDate, keyStats, sections, keyFindings, emergingTrends, challenges, opportunities, expertQuotes, aboutContentSathi } = report;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --primary: #0f172a;
      --accent: #6366f1;
      --accent-light: #818cf8;
      --gold: #f59e0b;
      --teal: #14b8a6;
      --rose: #f43f5e;
      --bg: #ffffff;
      --surface: #f8fafc;
      --border: #e2e8f0;
      --text: #1e293b;
      --muted: #64748b;
    }

    body {
      font-family: 'Inter', sans-serif;
      color: var(--text);
      background: var(--bg);
      line-height: 1.7;
    }

    /* ── Cover Page ── */
    .cover {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0f172a 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 80px;
      position: relative;
      overflow: hidden;
      page-break-after: always;
    }

    .cover::before {
      content: '';
      position: absolute;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
      top: -100px;
      right: -100px;
    }

    .cover::after {
      content: '';
      position: absolute;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(20, 184, 166, 0.2) 0%, transparent 70%);
      bottom: -50px;
      left: 100px;
    }

    .cover-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #a5b4fc;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      padding: 8px 16px;
      border-radius: 100px;
      margin-bottom: 40px;
      width: fit-content;
    }

    .cover h1 {
      font-family: 'Playfair Display', serif;
      font-size: 64px;
      font-weight: 900;
      color: white;
      line-height: 1.1;
      max-width: 800px;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }

    .cover h1 span { color: #a5b4fc; }

    .cover .subtitle {
      font-size: 18px;
      color: rgba(255,255,255,0.6);
      max-width: 600px;
      margin-bottom: 60px;
      font-weight: 400;
      position: relative;
      z-index: 1;
    }

    .cover-meta {
      display: flex;
      gap: 40px;
      position: relative;
      z-index: 1;
    }

    .cover-meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .cover-meta-item .label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.4);
    }

    .cover-meta-item .value {
      font-size: 14px;
      font-weight: 600;
      color: rgba(255,255,255,0.8);
    }

    .cover-stat-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 60px;
      position: relative;
      z-index: 1;
      border-top: 1px solid rgba(255,255,255,0.1);
      padding-top: 40px;
    }

    .cover-stat {
      padding: 20px;
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.1);
    }

    .cover-stat .num {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      color: #a5b4fc;
      margin-bottom: 4px;
    }

    .cover-stat .desc {
      font-size: 12px;
      color: rgba(255,255,255,0.5);
      line-height: 1.4;
    }

    /* ── Page Layout ── */
    .page {
      max-width: 900px;
      margin: 0 auto;
      padding: 60px 80px;
    }

    .section {
      page-break-before: always;
      padding-top: 40px;
    }

    .section:first-of-type {
      page-break-before: avoid;
    }

    /* ── Section Headers ── */
    .section-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--accent);
      background: rgba(99, 102, 241, 0.08);
      padding: 6px 12px;
      border-radius: 100px;
      border: 1px solid rgba(99, 102, 241, 0.2);
      margin-bottom: 16px;
    }

    h2 {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 8px;
      line-height: 1.2;
    }

    h3 {
      font-size: 20px;
      font-weight: 700;
      color: var(--primary);
      margin-top: 32px;
      margin-bottom: 12px;
    }

    h4 {
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
      margin-top: 24px;
      margin-bottom: 8px;
    }

    p {
      margin-bottom: 16px;
      color: #374151;
      font-size: 15px;
    }

    .lead {
      font-size: 18px;
      color: var(--muted);
      margin-bottom: 40px;
      font-weight: 400;
      border-bottom: 1px solid var(--border);
      padding-bottom: 24px;
    }

    /* ── Key Stats Grid ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin: 32px 0;
    }

    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
    }

    .stat-card .num {
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      font-weight: 700;
      color: var(--accent);
      margin-bottom: 4px;
    }

    .stat-card .label {
      font-size: 12px;
      color: var(--muted);
      font-weight: 500;
      line-height: 1.4;
    }

    /* ── Finding Cards ── */
    .findings-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 24px 0;
    }

    .finding-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: var(--surface);
      border-radius: 12px;
      border: 1px solid var(--border);
    }

    .finding-num {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: var(--primary);
      color: white;
      font-size: 12px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .finding-text {
      font-size: 14px;
      color: var(--text);
      font-weight: 500;
      line-height: 1.5;
    }

    /* ── Quote Cards ── */
    .quote-card {
      background: linear-gradient(135deg, #f8fafc, #eef2ff);
      border-left: 4px solid var(--accent);
      border-radius: 0 16px 16px 0;
      padding: 24px 28px;
      margin: 24px 0;
    }

    .quote-text {
      font-size: 17px;
      font-style: italic;
      color: var(--text);
      margin-bottom: 12px;
      line-height: 1.6;
      font-weight: 500;
    }

    .quote-attr {
      font-size: 12px;
      color: var(--muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* ── Highlight Box ── */
    .highlight-box {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(20, 184, 166, 0.05));
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 20px;
      padding: 28px 32px;
      margin: 32px 0;
    }

    .highlight-box h4 {
      color: var(--accent);
      margin-top: 0;
    }

    /* ── Trend Pills ── */
    .trend-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 20px 0;
    }

    .trend-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 14px 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
    }

    .trend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--teal);
      margin-top: 6px;
      flex-shrink: 0;
    }

    .trend-text {
      font-size: 13px;
      color: var(--text);
      font-weight: 500;
      line-height: 1.5;
    }

    /* ── Opportunities / Challenges ── */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin: 24px 0;
    }

    .col-card {
      padding: 24px;
      border-radius: 16px;
      border: 1px solid var(--border);
    }

    .col-card.opp { background: rgba(20, 184, 166, 0.05); }
    .col-card.chal { background: rgba(244, 63, 94, 0.05); }

    .col-card h4 {
      margin-top: 0;
      margin-bottom: 16px;
    }
    .col-card.opp h4 { color: var(--teal); }
    .col-card.chal h4 { color: var(--rose); }

    .col-card ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .col-card li {
      font-size: 13px;
      color: var(--text);
      padding-left: 16px;
      position: relative;
    }

    .col-card li::before {
      content: '→';
      position: absolute;
      left: 0;
      color: var(--muted);
    }

    /* ── About / Footer ── */
    .about-section {
      background: linear-gradient(135deg, #0f172a, #1e1b4b);
      color: white;
      padding: 60px 80px;
      margin: 0;
    }

    .about-section h3 { color: #a5b4fc; }
    .about-section p { color: rgba(255,255,255,0.7); }

    .footer {
      background: var(--primary);
      color: rgba(255,255,255,0.5);
      padding: 24px 80px;
      font-size: 11px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* ── Table of Contents ── */
    .toc {
      background: var(--surface);
      border-radius: 20px;
      border: 1px solid var(--border);
      padding: 32px;
      margin: 40px 0;
    }

    .toc h3 { margin-top: 0; color: var(--primary); }

    .toc-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px dashed var(--border);
      font-size: 14px;
    }

    .toc-item:last-child { border-bottom: none; }
    .toc-num { color: var(--accent); font-weight: 700; font-size: 12px; }
    .toc-label { font-weight: 500; }

    /* ── Section content from AI ── */
    .ai-content { margin: 24px 0; }
    .ai-content h2, .ai-content h3, .ai-content h4 { margin-top: 24px; }

    @media print {
      .cover { page-break-after: always; }
      .section { page-break-before: always; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>

<!-- ═══════════════════════════ COVER PAGE ══════════════════════════════ -->
<div class="cover">
  <div class="cover-badge">🏆 Industry Benchmark Report · Free Download</div>
  
  <h1>The State of AI in<br><span>Indian Real Estate</span><br>Marketing — 2026</h1>
  
  <p class="subtitle">${subtitle || "India's First Benchmark Report on AI-Powered Property Content Strategy"}</p>
  
  <div class="cover-meta">
    <div class="cover-meta-item">
      <span class="label">Published by</span>
      <span class="value">${publisher || "ContentSathi Research"}</span>
    </div>
    <div class="cover-meta-item">
      <span class="label">Published</span>
      <span class="value">${publishDate || "March 2026"}</span>
    </div>
    <div class="cover-meta-item">
      <span class="label">Edition</span>
      <span class="value">2026 · Volume 1</span>
    </div>
  </div>

  <div class="cover-stat-grid">
    <div class="cover-stat">
      <div class="num">23%</div>
      <div class="desc">AI adoption rate among Indian real estate agencies</div>
    </div>
    <div class="cover-stat">
      <div class="num">₹65,000Cr</div>
      <div class="desc">Annual Indian real estate marketing spend</div>
    </div>
    <div class="cover-stat">
      <div class="num">68%</div>
      <div class="desc">Property deals that start on WhatsApp</div>
    </div>
    <div class="cover-stat">
      <div class="num">2.8x</div>
      <div class="desc">More engagement with vernacular vs English content</div>
    </div>
    <div class="cover-stat">
      <div class="num">82%</div>
      <div class="desc">Tier-2 agents who have never used AI for content</div>
    </div>
    <div class="cover-stat">
      <div class="num">4.5x</div>
      <div class="desc">More property inquiries from video vs static content</div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════ TOC PAGE ════════════════════════════════ -->
<div class="page">
  <div style="padding-top: 60px;">
    <div class="section-tag">Table of Contents</div>
    <div class="toc">
      <div class="toc-item">
        <span><span class="toc-num">01 &nbsp;</span><span class="toc-label">Executive Summary</span></span>
      </div>
      <div class="toc-item">
        <span><span class="toc-num">02 &nbsp;</span><span class="toc-label">Market Landscape</span></span>
      </div>
      <div class="toc-item">
        <span><span class="toc-num">03 &nbsp;</span><span class="toc-label">AI Adoption Analysis</span></span>
      </div>
      <div class="toc-item">
        <span><span class="toc-num">04 &nbsp;</span><span class="toc-label">Content Strategy Benchmarks</span></span>
      </div>
      <div class="toc-item">
        <span><span class="toc-num">05 &nbsp;</span><span class="toc-label">Future Predictions & Recommendations</span></span>
      </div>
      <div class="toc-item">
        <span><span class="toc-num">06 &nbsp;</span><span class="toc-label">Key Findings</span></span>
      </div>
      <div class="toc-item">
        <span><span class="toc-num">07 &nbsp;</span><span class="toc-label">Expert Perspectives</span></span>
      </div>
      <div class="toc-item">
        <span><span class="toc-num">08 &nbsp;</span><span class="toc-label">About ContentSathi</span></span>
      </div>
    </div>

    <!-- Key Stats at a Glance -->
    <div class="section-tag">Key Stats at a Glance</div>
    <div class="stats-grid">
      ${Object.entries(keyStats || {}).slice(0, 6).map(([key, val]) => `
        <div class="stat-card">
          <div class="num">${String(val).split(' ')[0]}</div>
          <div class="label">${String(val).split(' ').slice(1).join(' ')}</div>
        </div>
      `).join('')}
    </div>
  </div>
</div>

<!-- ═══════════════════════════ SECTION 1: EXECUTIVE SUMMARY ══════════════ -->
<div class="page">
  <div class="section">
    <div class="section-tag">01 · Executive Summary</div>
    <h2>Setting the Stage for India's AI Real Estate Era</h2>
    <p class="lead">Published March 2026 · ${publisher || "ContentSathi Research Division"}</p>
    <div class="ai-content">
      ${markdownToHTML(sections?.executiveSummary || '')}
    </div>
  </div>
</div>

<!-- ═══════════════════════════ SECTION 2: MARKET LANDSCAPE ══════════════ -->
<div class="page">
  <div class="section">
    <div class="section-tag">02 · Market Landscape</div>
    <h2>Indian Real Estate Meets the AI Revolution</h2>
    <div class="ai-content">
      ${markdownToHTML(sections?.marketLandscape || '')}
    </div>
  </div>
</div>

<!-- ═══════════════════════════ SECTION 3: AI ADOPTION ══════════════════ -->
<div class="page">
  <div class="section">
    <div class="section-tag">03 · AI Adoption Analysis</div>
    <h2>Where India's Real Estate Sector Stands</h2>
    <div class="ai-content">
      ${markdownToHTML(sections?.aiAdoption || '')}
    </div>
  </div>
</div>

<!-- ═══════════════════════════ SECTION 4: BENCHMARKS ════════════════════ -->
<div class="page">
  <div class="section">
    <div class="section-tag">04 · Content Strategy Benchmarks</div>
    <h2>The 2026 Indian Real Estate Content Standard</h2>
    <div class="ai-content">
      ${markdownToHTML(sections?.contentBenchmarks || '')}
    </div>
  </div>
</div>

<!-- ═══════════════════════════ SECTION 5: PREDICTIONS ══════════════════ -->
<div class="page">
  <div class="section">
    <div class="section-tag">05 · Future Predictions</div>
    <h2>2026-2027: The Road Ahead</h2>
    <div class="ai-content">
      ${markdownToHTML(sections?.futurePredictions || '')}
    </div>
  </div>
</div>

<!-- ═══════════════════════════ SECTION 6: KEY FINDINGS  ══════════════════ -->
<div class="page">
  <div class="section">
    <div class="section-tag">06 · Key Findings</div>
    <h2>The Data That Matters</h2>
    
    <div class="findings-list">
      ${(keyFindings || []).map((f: string, i: number) => `
        <div class="finding-item">
          <div class="finding-num">${i + 1}</div>
          <div class="finding-text">${f}</div>
        </div>
      `).join('')}
    </div>

    <h3>Emerging Trends</h3>
    <div class="trend-grid">
      ${(emergingTrends || []).map((t: string) => `
        <div class="trend-item">
          <div class="trend-dot"></div>
          <div class="trend-text">${t}</div>
        </div>
      `).join('')}
    </div>

    <div class="two-col" style="margin-top: 32px;">
      <div class="col-card opp">
        <h4>🟢 Opportunities</h4>
        <ul>
          ${(opportunities || []).map((o: string) => `<li>${o}</li>`).join('')}
        </ul>
      </div>
      <div class="col-card chal">
        <h4>🔴 Challenges</h4>
        <ul>
          ${(challenges || []).map((c: string) => `<li>${c}</li>`).join('')}
        </ul>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════ SECTION 7: EXPERT PERSPECTIVES ═══════════ -->
<div class="page">
  <div class="section">
    <div class="section-tag">07 · Expert Perspectives</div>
    <h2>Voices from the Industry</h2>
    
    ${(expertQuotes || []).map((q: string) => {
      const parts = q.split(' — ');
      return `
        <div class="quote-card">
          <div class="quote-text">${parts[0]}</div>
          ${parts[1] ? `<div class="quote-attr">— ${parts[1]}</div>` : ''}
        </div>
      `;
    }).join('')}

    <div class="highlight-box" style="margin-top: 40px;">
      <h4>📊 Research Methodology</h4>
      <p style="font-size:14px; margin-bottom:8px;">This report synthesizes intelligence from:</p>
      <ul style="list-style:none; display:flex; flex-direction:column; gap:6px;">
        ${["LinkedIn professional posts and industry discussions", "MagicBricks and 99acres listing data and portal trends", "Real estate buyer forums and Reddit r/IndiaInvestments", "Economic Times, Mint, and Business Standard coverage", "PropTech industry podcasts and expert interview transcripts", "ContentSathi platform data from active users (anonymized)", "RERA and MahaRERA regulatory releases"].map(item => 
          `<li style="font-size:13px; color:#374151; padding-left:16px; position:relative;"><span style="position:absolute;left:0;color:#6366f1;">•</span>${item}</li>`
        ).join('')}
      </ul>
    </div>
  </div>
</div>

<!-- ═══════════════════════════ ABOUT CONTENTSATHI ════════════════════════ -->
<div class="about-section">
  <div style="max-width: 760px;">
    <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.4);color:#a5b4fc;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:6px 14px;border-radius:100px;margin-bottom:24px;">
      About ContentSathi
    </div>
    <h3 style="font-family:'Playfair Display',serif; font-size:28px; margin-bottom:16px;">India's AI Content Engine for Real Estate</h3>
    <p style="font-size:15px; line-height:1.7;">${aboutContentSathi || "ContentSathi is India's first AI-powered content engine built specifically for Indian real estate professionals."}</p>
    
    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; margin-top:32px; padding-top:32px; border-top:1px solid rgba(255,255,255,0.1);">
      <div style="text-align:center;">
        <div style="font-family:'Playfair Display',serif; font-size:28px; font-weight:700; color:#a5b4fc;">10+</div>
        <div style="font-size:12px; color:rgba(255,255,255,0.5); margin-top:4px;">Indian Languages</div>
      </div>
      <div style="text-align:center;">
        <div style="font-family:'Playfair Display',serif; font-size:28px; font-weight:700; color:#a5b4fc;">7</div>
        <div style="font-size:12px; color:rgba(255,255,255,0.5); margin-top:4px;">AI Agents Working 24/7</div>
      </div>
      <div style="text-align:center;">
        <div style="font-family:'Playfair Display',serif; font-size:28px; font-weight:700; color:#a5b4fc;">6+</div>
        <div style="font-size:12px; color:rgba(255,255,255,0.5); margin-top:4px;">Sources Monitored Daily</div>
      </div>
    </div>

    <div style="margin-top:32px; padding:20px; background:rgba(99,102,241,0.15); border-radius:16px; border:1px solid rgba(99,102,241,0.3);">
      <p style="color:rgba(255,255,255,0.8); font-size:14px; margin:0;">
        🔒 <strong style="color:white;">Free Download</strong> — Share this report with your network. Attribution: ContentSathi Research Division, 2026.
      </p>
    </div>
  </div>
</div>

<div class="footer">
  <span>© 2026 ContentSathi • contentsathi.com • Nagpur, Maharashtra, India</span>
  <span>Generated ${new Date().toLocaleDateString("en-IN")} • ${report.reportId || "CS-2026"}</span>
</div>

</body>
</html>`;
}

function markdownToHTML(markdown: string): string {
  if (!markdown) return '';
  
  return markdown
    // H2
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    // H3
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    // H4
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<div class="quote-card"><div class="quote-text">$1</div></div>')
    // HR
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">')
    // Unordered list items
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    // Ordered list — wrap consecutive <li> in <ul>
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul style="padding-left:20px;margin:12px 0;display:flex;flex-direction:column;gap:6px;">${m}</ul>`)
    // Paragraphs — wrap lines of text
    .replace(/^([^<\n].+)$/gm, '<p>$1</p>')
    // Clean up double paragraphs
    .replace(/<p><\/p>/g, '')
    // Tables (basic)
    .replace(/^\|(.+)\|$/gm, (line) => {
      const cells = line.split('|').filter(c => c.trim() !== '');
      const isHeader = cells.some(c => c.includes('---'));
      if (isHeader) return '';
      const tag = 'td';
      return `<tr>${cells.map(c => `<${tag} style="padding:8px 12px;border:1px solid #e2e8f0;">${c.trim()}</${tag}>`).join('')}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, (m) => 
      `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">${m}</table>`
    );
}
