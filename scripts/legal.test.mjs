import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { documents, features, root, version, materializeDocument, parseDocument, readDocument, renderDocument, validateFeatures } from "./legal.mjs";
import { publicationErrors, releaseErrors, requiredChecks } from "./check-release.mjs";

for (const document of documents) {
  test(`${document.slug}: source, generated page, metadata and anchors agree`, () => {
    const source = readDocument(document.slug);
    const doc = parseDocument(source);
    const html = renderDocument(document.slug);
    assert.equal(doc.fields["시행일"], version);
    assert.equal(doc.fields["버전"], version);
    assert.equal(fs.readFileSync(path.join(root, "src/legal/brew-way", document.slug, "index.html"), "utf8"), html);
    assert.equal((html.match(/<h1>/g) ?? []).length, 1);
    assert.equal((html.match(/class="legal-section"/g) ?? []).length, doc.sections.length);
    assert.equal((html.match(/class="section-number"/g) ?? []).length, doc.sections.length);
    if (source.includes("| --- |")) assert.match(html, /<\/(?:ul|table)>\s*<p>/, "Paragraphs after lists and tables must stay separate");
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length);
    for (const section of doc.sections) {
      assert.ok(html.includes(`<section class="legal-section" aria-labelledby="${section.id}">`));
      assert.ok(section.html.length > 0);
    }
    assert.doesNotMatch(html, /class="(?:collection-heading|document-nav|review-banner|document-aside|document-summary|support-band|legal-footer)"/);
    assert.doesNotMatch(html, /class="(?:document-tools|icon-control)"/);
    assert.doesNotMatch(html, /<dt>버전<\/dt>|시행일 · 버전/);
    assert.doesNotMatch(source, /\b(userKey|scope|agreedTerms|JWT|API|HMAC|OCR|RLS|Supabase Auth)\b/);
    assert.doesNotMatch(html.match(/<header class="legal-header"[\s\S]*?<\/header>/)?.[0] ?? "", /mailto:/);
    assert.doesNotMatch(html.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? "", /mailto:/);
  });
}

function listHtml(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? listHtml(target) : entry.name.endsWith(".html") ? [target] : [];
  });
}

for (const base of ["https://example.test/", "https://example.test/whitewise-official-site/"]) {
test(`all static HTML links resolve under ${new URL(base).pathname}`, () => {
  const src = path.join(root, "src");
  for (const file of listHtml(src)) {
    const html = fs.readFileSync(file, "utf8");
    const page = new URL(path.relative(src, file), base);
    for (const [, attribute] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const url = new URL(attribute, page);
      if (url.origin !== new URL(base).origin) continue;
      assert.ok(url.pathname.startsWith(new URL(base).pathname), `Subpath escaped: ${file}: ${attribute}`);
      let target = path.join(src, decodeURIComponent(url.pathname.slice(new URL(base).pathname.length)));
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
      assert.ok(fs.existsSync(target), `Missing local target: ${file}: ${attribute}`);
      if (url.hash) assert.ok(fs.readFileSync(target, "utf8").includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `Missing fragment: ${attribute}`);
    }
  }
});
}

test("public site pages do not expose Brew Way legal document links", () => {
  for (const file of ["index.html", "services/brew-way/index.html"]) {
    const html = fs.readFileSync(path.join(root, "src", file), "utf8");
    assert.doesNotMatch(html, /href="[^"]*legal\/brew-way\//);
  }
});

test("branch-based Pages files match the build artifact", () => {
  function check(directory, relative = "") {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const name = path.join(relative, entry.name);
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) check(file, name);
      else assert.deepEqual(fs.readFileSync(path.join(root, name)), fs.readFileSync(file), `Stale published file: ${name}`);
    }
  }
  check(path.join(root, "dist"));
});

test("version or effective date cannot silently change", () => {
  assert.throws(() => parseDocument(readDocument("terms").replace("시행일: 2026-08-28", "시행일: 2026-08-29")), /changed/);
  assert.throws(() => parseDocument(readDocument("terms").replace("버전: 2026-08-28", "버전: 2026-08-29")), /changed/);
});

test("legal Markdown rejects raw HTML and executable links", () => {
  assert.throws(() => parseDocument(readDocument("terms") + '\n<script>alert(1)</script>\n'), /Raw HTML/);
  assert.throws(() => parseDocument(readDocument("terms") + '\n[bad](javascript:alert)\n'), /Unsafe/);
});

test("tables have captions, header associations and mobile labels", () => {
  const html = renderDocument("privacy");
  assert.ok(html.includes('<caption class="sr-only">'));
  assert.ok(html.includes('scope="col" role="columnheader"'));
  assert.ok(html.includes('headers="table-1-0" data-label="구분"'));
});

test("privacy matches inquiry plaintext storage and does not claim automatic unlink deletion", () => {
  const source = readDocument("privacy");
  assert.ok(source.includes("별도로 암호화한 문장으로 바꾸어 저장하지 않으며"));
  assert.ok(source.includes("현재 계정이나 문의가 자동으로 모두 삭제되는 기능은 아닙니다"));
  assert.ok(source.includes("현재 광고 발송 기능은 운영하지 않으며"));
});

test("required login consent metadata is not rendered as page chrome", () => {
  assert.equal(parseDocument(readDocument("consent")).fields["동의 구분"], "로그인 시 필수");
  assert.doesNotMatch(renderDocument("consent"), /로그인 시 필수/);
});

test("feature registry is complete and drives the terms and privacy pages", () => {
  assert.doesNotThrow(() => validateFeatures(features));
  for (const feature of features.filter((item) => item.status === "active")) {
    assert.ok(renderDocument("terms").includes(feature.name));
    assert.ok(renderDocument("privacy").includes(feature.name));
    assert.ok(feature.termsSummary && feature.privacySummary);
  }
  assert.throws(() => validateFeatures([features[0], { ...features[1], id: features[0].id }, ...features.slice(2)]), /unique/);
  assert.throws(() => validateFeatures([{ ...features[0], termsSummary: "" }]), /Incomplete/);
  for (const feature of features.filter((item) => item.status === "planned")) {
    assert.ok(["one-time", "recurring"].includes(feature.billingType));
    assert.ok(renderDocument("terms").includes(feature.name));
    assert.ok(renderDocument("privacy").includes(feature.name));
  }
  assert.throws(() => validateFeatures([{ ...features.find((item) => item.status === "planned"), billingType: "monthly" }]), /billing type/);
});

test("optional advertising choices do not promise existing opt-out controls or require inquiries", () => {
  for (const slug of ["marketing", "night-benefit"]) {
    const source = readDocument(slug);
    assert.equal(parseDocument(source).fields["동의 구분"], "선택 동의");
    assert.ok(source.includes("현재 광고 발송 기능은 운영하지 않"));
    assert.ok(/문의(?: 접수만을 광고 수신 거부의 유일한 방법으로 두지|하기를 수신 거부의 유일한 방법으로 두지)/.test(source));
    assert.ok(source.includes("오후 9시 전까지") || source.includes("오전 8시 전까지"));
  }
});

const confirmed = () => ({ version, checks: requiredChecks.map((id) => ({ id, status: "confirmed", evidence: "Verified by operator" })) });
test("release check refuses missing or pending operational facts and unresolved source text", () => {
  assert.ok(releaseErrors({ version, checks: [] }, {}).length > 0);
  const pending = confirmed();
  pending.checks[0].status = "pending";
  assert.ok(releaseErrors(pending, {}).length > 0);
  assert.ok(releaseErrors(confirmed(), { privacy: "[운영 확인 필요: 기간]" }).length > 0);
  const noEvidence = confirmed();
  noEvidence.checks[0].evidence = "";
  assert.ok(releaseErrors(noEvidence, {}).length > 0);
  assert.deepEqual(releaseErrors(confirmed(), { privacy: "Reviewed text" }), []);
});

test("review publication requires every document and search exclusion without visible review chrome", () => {
  const config = { version, publicationMode: "review", checks: [] };
  const sources = Object.fromEntries(documents.map(({ slug }) => [slug, "[운영 확인 필요: 기간]"]));
  const page = '<meta name="robots" content="noindex, nofollow"><h1>검토 문서</h1>';
  const pages = Object.fromEntries(documents.map(({ slug }) => [slug, page]));
  assert.deepEqual(publicationErrors(config, sources, pages), []);
  assert.ok(releaseErrors(config, sources).length > 0);
  assert.ok(publicationErrors({ ...config, publicationMode: "production" }, sources, pages).length > 0);
  assert.ok(publicationErrors({ ...config, publicationMode: undefined }, sources, pages).length > 0);
  assert.ok(publicationErrors({ ...config, version: "wrong" }, sources, pages).length > 0);
  assert.ok(publicationErrors(config, { ...sources, privacy: "" }, pages).length > 0);
  assert.ok(publicationErrors(config, sources, { ...pages, privacy: "" }).length > 0);
  assert.ok(publicationErrors(config, sources, { ...pages, privacy: page.replace('content="noindex, nofollow"', '') }).length > 0);
  assert.ok(publicationErrors(config, sources, { ...pages, privacy: `${page}<div class="review-banner"></div>` }).length > 0);
  const readySources = Object.fromEntries(documents.map(({ slug }) => [slug, "Reviewed text"]));
  const readyPages = Object.fromEntries(documents.map(({ slug }) => [slug, "<!doctype html><h1>Reviewed text</h1>"]));
  assert.deepEqual(publicationErrors({ ...confirmed(), publicationMode: "production" }, readySources, readyPages), []);
});

test("built Markdown downloads contain the same materialized content as the pages", () => {
  for (const { slug } of documents) {
    const download = fs.readFileSync(path.join(root, "dist/legal/brew-way", slug, "versions", `${version}.md`), "utf8");
    assert.equal(download, materializeDocument(slug, readDocument(slug)));
    assert.doesNotMatch(download, /\{\{[A-Z_]+\}\}/);
  }
});
