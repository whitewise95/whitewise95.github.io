import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const version = "2026-08-28";
export const documents = [
  { slug: "terms", label: "이용약관" },
  { slug: "privacy", label: "개인정보 처리방침" },
  { slug: "consent", label: "개인정보 수집·이용" },
  { slug: "marketing", label: "광고성 정보 수신" },
  { slug: "night-benefit", label: "야간 광고성 정보 수신" },
];
export const legalDirectory = path.join(root, "src/legal/brew-way");
export const release = JSON.parse(fs.readFileSync(path.join(root, "legal-release.json"), "utf8"));
export const features = JSON.parse(fs.readFileSync(path.join(legalDirectory, "features.json"), "utf8"));
export const isDraft = release.publicationMode === "review" || release.checks.some((check) => check.status !== "confirmed");
export const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

export function readDocument(slug) {
  if (!documents.some((document) => document.slug === slug)) throw new Error("Unknown legal document");
  return fs.readFileSync(path.join(legalDirectory, slug, "versions", `${version}.md`), "utf8");
}

export function validateFeatures(registry = features) {
  const ids = new Set();
  for (const feature of registry) {
    if (!feature.id || ids.has(feature.id)) throw new Error("Feature ids must be unique");
    if (!/^[a-z0-9-]+$/.test(feature.id)) throw new Error(`Invalid feature id: ${feature.id}`);
    if (!feature.name || !feature.termsSummary || !feature.privacySummary) throw new Error(`Incomplete legal feature: ${feature.id}`);
    if (!["active", "planned"].includes(feature.status)) throw new Error(`Invalid feature status: ${feature.id}`);
    if (feature.status === "planned" && !["one-time", "recurring"].includes(feature.billingType)) {
      throw new Error(`Planned paid features need a billing type: ${feature.id}`);
    }
    if (!Array.isArray(feature.dataCategories)) throw new Error(`Invalid feature data categories: ${feature.id}`);
    ids.add(feature.id);
  }
  if (!registry.some((feature) => feature.id === "support-inquiry" && feature.status === "active")) {
    throw new Error("The active inquiry feature must remain in the legal registry");
  }
  return registry;
}

validateFeatures();

export function materializeDocument(slug, markdown) {
  const plannedFeatures = features.filter((feature) => feature.status === "planned");
  const replacements = {
    "{{FEATURE_CATALOG}}": features.filter((feature) => feature.status === "active")
      .map((feature) => `- **${feature.name}**: ${feature.termsSummary}`).join("\n"),
    "{{FEATURE_PRIVACY_NOTE}}": features.filter((feature) => feature.status === "active")
      .map((feature) => `- **${feature.name}**: ${feature.privacySummary}`).join("\n"),
    "{{PLANNED_FEATURE_CATALOG}}": plannedFeatures.length
      ? plannedFeatures.map((feature) => `- **${feature.name}**: ${feature.termsSummary}`).join("\n")
      : "현재 예정된 유료 기능이 없습니다.",
    "{{PLANNED_FEATURE_PRIVACY_NOTE}}": plannedFeatures.length
      ? plannedFeatures.map((feature) => `- **${feature.name}**: ${feature.privacySummary}`).join("\n")
      : "현재 예정된 유료 기능이 없습니다.",
  };
  return Object.entries(replacements).reduce((result, [marker, replacement]) => {
    if (slug === "terms" || slug === "privacy" || slug === "consent") return result.replaceAll(marker, replacement);
    return result;
  }, markdown);
}

export function parseDocument(markdown) {
  let tableNumber = 0;
  const parser = new Marked({
    gfm: true,
    walkTokens(token) {
      if (token.type === "html") throw new Error("Raw HTML is not allowed in legal Markdown");
      if ((token.type === "link" || token.type === "image") && /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(token.href)
        && !/^(https?:|mailto:)/i.test(token.href)) throw new Error("Unsafe legal link");
    },
    renderer: {
      table(token) {
        const prefix = `table-${++tableNumber}`;
        const labels = token.header.map((cell) => cell.text);
        const header = token.header.map((cell, index) => `<th id="${prefix}-${index}" scope="col" role="columnheader">${this.parser.parseInline(cell.tokens)}</th>`).join("");
        const rows = token.rows.map((row) => `<tr role="row">${row.map((cell, index) =>
          `<td role="cell" headers="${prefix}-${index}" data-label="${escape(labels[index])}">${this.parser.parseInline(cell.tokens)}</td>`).join("")}</tr>`).join("\n");
        return `<table role="table"><caption class="sr-only">${escape(labels.join(" · "))}</caption><thead role="rowgroup"><tr role="row">${header}</tr></thead><tbody role="rowgroup">${rows}</tbody></table>`;
      },
    },
  });
  const tokens = parser.lexer(markdown).filter((token) => token.type !== "space");
  // Enforce one predictable document envelope; the body remains standard Markdown.
  const [heading, metadata, intro, summary, ...body] = tokens;
  if (heading?.type !== "heading" || heading.depth !== 1 || metadata?.type !== "list"
    || intro?.type !== "paragraph" || summary?.type !== "blockquote") throw new Error("Invalid legal document envelope");
  const fields = Object.fromEntries(metadata.items.map((item) => {
    const colon = item.text.indexOf(":");
    if (colon < 1) throw new Error("Invalid legal metadata");
    return [item.text.slice(0, colon), item.text.slice(colon + 1).trim()];
  }));
  if (fields["버전"] !== version || fields["시행일"] !== version) throw new Error("Legal version or effective date changed");
  const sections = [];
  for (const token of body) {
    if (token.type === "heading" && token.depth === 2) {
      sections.push({ id: `section-${sections.length + 1}`, title: token.text, tokens: [] });
    } else {
      if (!sections.length || (token.type === "heading" && token.depth === 1)) throw new Error("Invalid legal section");
      sections.at(-1).tokens.push(token);
    }
  }
  if (!sections.length) throw new Error("Empty legal document");
  return {
    title: heading.text,
    fields,
    description: intro.text,
    intro: parser.parse(intro.raw),
    summary: parser.parse(summary.raw),
    sections: sections.map((section) => ({ ...section, html: parser.parse(section.tokens.map((token) => token.raw).join("\n\n")) })),
  };
}

const icon = (name) => `<img src="../../../assets/icons/${name}.svg" width="20" height="20" alt="" aria-hidden="true">`;

export function renderDocument(slug, markdown = readDocument(slug)) {
  const doc = parseDocument(materializeDocument(slug, markdown));
  const draft = isDraft || markdown.includes("[운영 확인 필요:");
  const body = doc.sections.map((section, index) => {
    const match = section.title.match(/^(제\d+조|\d+\.)\s*(.*)$/);
    const sectionNumber = match?.[1] ?? String(index + 1).padStart(2, "0");
    const sectionTitle = match?.[2] || section.title;
    return `<section class="legal-section" aria-labelledby="${section.id}"><h2 id="${section.id}" tabindex="-1"><span class="section-number" aria-hidden="true">${escape(sectionNumber)}</span><span>${escape(sectionTitle)}</span></h2>${section.html}</section>`;
  }).join("\n");
  return `<!doctype html>
<!-- Generated from versions/${version}.md by scripts/legal.mjs. Edit the Markdown, not this file. -->
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(doc.title)} | WhiteWise</title>
  <meta name="description" content="${escape(doc.description)}">
  ${draft ? '<meta name="robots" content="noindex, nofollow">' : ""}
  <meta name="theme-color" content="#ffffff">
  <link rel="icon" href="../../../assets/brew-way-logo.png" type="image/png">
  <link rel="stylesheet" href="../../../assets/legal.css">
</head>
<body>
  <a class="skip-link" href="#main">본문으로 이동</a>
  <header class="legal-header" id="top">
    <nav class="legal-container top-nav" aria-label="주요 메뉴">
      <a class="wordmark" href="../../../" aria-label="WhiteWise 홈">WhiteWise<span>화이트와이즈</span></a>
      <a class="service-link" href="../../../services/brew-way/">브루웨이 ${icon("arrow-up-right")}</a>
    </nav>
  </header>
  <main id="main" class="legal-container legal-main" tabindex="-1">
    <header class="document-heading">
${slug === "consent" ? "" : `      <div class="document-kicker">${doc.fields["동의 구분"] ? `<span class="consent-type">${escape(doc.fields["동의 구분"])}</span>` : "<span>이용자 안내</span>"}</div>`}
      <h1>${escape(doc.title)}</h1>
      <div class="document-description">${doc.intro}</div>
      <div class="document-meta-row">
        <dl class="document-meta"><div><dt>시행일</dt><dd><time datetime="${version}">${version}</time></dd></div></dl>
      </div>
    </header>
    <div class="legal-layout">
      <article class="document-body" aria-label="${escape(doc.title)} 본문">
        ${body}
        <div class="document-end"><span>시행일 ${version}</span><a class="back-to-top" href="#top">처음으로 ${icon("arrow-up")}</a></div>
      </article>
    </div>
  </main>
</body>
</html>
`;
}

export function writeDocuments() {
  for (const doc of documents) fs.writeFileSync(path.join(legalDirectory, doc.slug, "index.html"), renderDocument(doc.slug));
  const iconDirectory = path.join(root, "src/assets/icons");
  fs.mkdirSync(iconDirectory, { recursive: true });
  const lucideDirectory = path.join(root, "node_modules/lucide-static");
  for (const name of ["arrow-up", "arrow-up-right"]) {
    fs.copyFileSync(path.join(lucideDirectory, "icons", `${name}.svg`), path.join(iconDirectory, `${name}.svg`));
  }
  fs.copyFileSync(path.join(lucideDirectory, "LICENSE"), path.join(iconDirectory, "LICENSE.txt"));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] !== "--write") throw new Error("Use --write to generate legal pages");
  writeDocuments();
  console.log(`Generated ${documents.length} legal pages (${isDraft ? "review draft" : "release checked"}), version ${version}`);
}
