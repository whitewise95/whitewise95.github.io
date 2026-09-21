import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("portfolio route is built for both deployment modes", () => {
  execFileSync(process.execPath, ["scripts/build.js"], { cwd: root });

  const built = path.join(root, "dist/portfolio/index.html");
  const branch = path.join(root, "portfolio/index.html");
  assert.ok(fs.existsSync(built), "dist portfolio route must exist");
  assert.ok(fs.existsSync(branch), "branch portfolio route must exist");

  const html = fs.readFileSync(built, "utf8");
  assert.match(html, /href="\.\.\/"[^>]*>경력기술서<\/a>/);
  assert.match(html, /href="\.\/"[^>]*aria-current="page"[^>]*>포트폴리오<\/a>/);
});

test("career document keeps each company navigable and includes the supplied work history", () => {
  const html = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
  assert.match(html, /<a href="portfolio\/">포트폴리오<\/a>/);
  assert.match(html, /<a href="\.\/" aria-current="page">경력기술서<\/a>/);
  assert.match(html, /<nav class="company-jump"[^>]*>/);
  assert.match(html, /<a href="#lemon">/);
  assert.match(html, /<a href="#actbase">/);
  assert.match(html, /<a href="#zest">/);
  assert.match(html, /<section[^>]*id="lemon"/);
  assert.match(html, /<section[^>]*id="actbase"/);
  assert.match(html, /<section[^>]*id="zest"/);
  assert.ok(html.indexOf('id="lemon"') < html.indexOf('id="actbase"'));
  assert.ok(html.indexOf('id="actbase"') < html.indexOf('id="zest"'));
  const lemonSection = html.slice(html.indexOf('id="lemon"'), html.indexOf('id="actbase"'));
  assert.equal((lemonSection.match(/<article class="work-item">/g) ?? []).length, 10);
  assert.match(html, /2024\.09[^<]*2026\.09/);
  assert.match(html, /2022\.09[^<]*2024\.01/);
  assert.match(html, /약 10분[^<]*1분 이하/);
  assert.match(html, /AdMob SSV/);
  assert.match(html, /Blue\/Green 배포/);
  assert.match(lemonSection, /모듈을 설계[·, ]+개발/);
  assert.match(lemonSection, /공식 걷기대회/);
  assert.match(lemonSection, /Spring Batch 기반 정산/);
  assert.match(lemonSection, /FCM 발송 실패 원인 분류/);
  assert.match(lemonSection, /서비스 전환[^<]*기존 서버 종료[^<]*자동화/);
  assert.doesNotMatch(html, /재직 중|CURRENT · HEALTHCARE PLATFORM|CAREER DOCUMENT/);
  assert.doesNotMatch(html, /class="career-brand"|class="header-contact"/);
  assert.doesNotMatch(html, /회사명을 선택하면 해당 경력으로 이동합니다/);
  assert.doesNotMatch(html, /class="contents"|class="work-number"/);
  assert.doesNotMatch(html, /deck-controls|data-deck|assets\/nav\.js/);
});

test("portfolio keeps only the two page tabs in its header", () => {
  const html = fs.readFileSync(path.join(root, "src/portfolio/index.html"), "utf8");
  assert.match(html, /<nav class="page-tabs"/);
  assert.doesNotMatch(html, /class="career-brand"|class="header-contact"/);
});

test("company service introductions link to the verified public products", () => {
  const html = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
  const lemon = html.slice(html.indexOf('id="lemon"'), html.indexOf('id="actbase"'));
  const actbase = html.slice(html.indexOf('id="actbase"'), html.indexOf('id="zest"'));
  const zest = html.slice(html.indexOf('id="zest"'));

  for (const section of [lemon, actbase, zest]) {
    assert.match(section, /class="service-feature service-feature--plain">\s*<p class="service-label">참여 서비스<\/p>\s*<div class="service-body">\s*<p class="company-intro">/);
  }
  assert.match(lemon, /건강의신/);
  assert.match(lemon, /초기 기획 단계부터 참여해[^<]*서비스 오픈 이후 운영과 기능 개선/);
  assert.match(lemon, /class="service-detail service-detail--media">/);
  assert.match(lemon, /src="assets\/health-god-app-icon\.jpg"/);
  assert.ok(fs.existsSync(path.join(root, "dist/assets/health-god-app-icon.jpg")));
  assert.match(lemon, /apps\.apple\.com\/kr\/app\/[^" ]*id6752885853/);
  assert.match(lemon, /play\.google\.com\/store\/apps\/details\?id=com\.lemonhc\.godofhealth\.prod/);
  assert.match(actbase, /포토몬 비즈프린트/);
  assert.match(actbase, /class="service-detail service-detail--media">/);
  assert.match(actbase, /src="assets\/photomon-bizprint-logo\.png"/);
  assert.ok(fs.existsSync(path.join(root, "dist/assets/photomon-bizprint-logo.png")));
  assert.match(actbase, /https:\/\/biz\.photomon\.com\//);
  assert.match(actbase, /레거시 공장 시스템/);
  assert.equal((actbase.match(/<article class="work-item">/g) ?? []).length, 2);
  assert.match(actbase, /프론트오피스 결제 화면에 필요한 백엔드 기능/);
  assert.match(actbase, /명함을 제작하는 에디터의 백엔드 기능/);
  assert.match(actbase, /풀무원 녹즙 사이트 고도화/);
  assert.match(actbase, /결제 기능에서 발생한 오류 수정/);
  assert.match(zest, /대구은행 백오피스/);
});

test("career and portfolio pages share a built stylesheet", () => {
  const career = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
  const portfolio = fs.readFileSync(path.join(root, "src/portfolio/index.html"), "utf8");
  assert.match(career, /href="assets\/career\.css\?v=20260921-3"/);
  assert.match(portfolio, /href="\.\.\/assets\/career\.css\?v=20260921-3"/);
  assert.ok(fs.existsSync(path.join(root, "dist/assets/career.css")));
});
