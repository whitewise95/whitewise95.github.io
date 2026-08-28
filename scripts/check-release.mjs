import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { documents, readDocument, release, root, version } from "./legal.mjs";

export const requiredChecks = ["operator", "retention_and_rights", "providers", "consent_and_age", "owner_review"];

export function releaseErrors(config, sources) {
  const errors = [];
  if (config.version !== version) errors.push("Review version does not match the legal version");
  for (const id of requiredChecks) {
    const matches = config.checks?.filter((check) => check.id === id) ?? [];
    if (matches.length !== 1 || matches[0].status !== "confirmed" || !matches[0].evidence?.trim()) {
      errors.push(`운영 확인 미완료: ${id}`);
    }
  }
  for (const [slug, source] of Object.entries(sources)) {
    if (source.includes("[운영 확인 필요:")) errors.push(`확정되지 않은 문구: ${slug}`);
  }
  return errors;
}

export function publicationErrors(config, sources, pages) {
  if (!["review", "production"].includes(config.publicationMode)) {
    return ["게시 모드를 review 또는 production으로 명시해야 합니다"];
  }
  const review = config.publicationMode === "review";
  const errors = review
    ? (config.version === version ? [] : ["Review version does not match the legal version"])
    : releaseErrors(config, sources);
  for (const { slug } of documents) {
    if (!sources[slug]?.trim()) errors.push(`약관 원문 누락: ${slug}`);
    const page = pages[slug] ?? "";
    if (!page.trim()) {
      errors.push(`게시할 HTML 누락: ${slug}`);
      continue;
    }
    const banner = page.includes('class="review-banner"');
    if (review && (!banner || !page.includes('<meta name="robots" content="noindex, nofollow">'))) {
      errors.push(`검토본 표시 또는 검색 제외 표식 누락: ${slug}`);
    }
    if (!review && banner) errors.push(`운영본에 검토본 표시가 남아 있음: ${slug}`);
  }
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== "--publication")) {
    throw new Error("Use no arguments for release checks, or --publication for publishing checks");
  }
  const publishing = args[0] === "--publication";
  const sources = Object.fromEntries(documents.map((doc) => [doc.slug, readDocument(doc.slug)]));
  const pages = publishing ? Object.fromEntries(documents.map(({ slug }) => {
    const file = path.join(root, "dist/legal/brew-way", slug, "index.html");
    return [slug, fs.existsSync(file) ? fs.readFileSync(file, "utf8") : ""];
  })) : {};
  const errors = publishing ? publicationErrors(release, sources, pages) : releaseErrors(release, sources);
  if (errors.length) {
    console.error("공개 배포를 중단합니다. docs/LEGAL_RELEASE_REVIEW.md를 확인하세요.\n" + errors.join("\n"));
    process.exitCode = 1;
  } else if (publishing && release.publicationMode === "review") {
    console.log("검토본 게시 검사 통과. 운영본 확정이나 법률 검토 완료를 뜻하지 않습니다.");
    const pending = releaseErrors(release, sources);
    if (pending.length) console.warn(pending.join("\n"));
  } else {
    console.log("Legal release checks passed. This is not a legal certification.");
  }
}
