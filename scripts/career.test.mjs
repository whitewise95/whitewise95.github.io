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
  assert.doesNotMatch(html, /<a href="\.\/"[^>]*>포트폴리오<\/a>/);
});

test("career document keeps each company navigable and includes the supplied work history", () => {
  const html = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
  assert.doesNotMatch(html, /<a href="portfolio\/">포트폴리오<\/a>/);
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
  assert.equal((lemonSection.match(/<article class="work-item">/g) ?? []).length, 9);
  assert.match(html, /2024\.09[^<]*2026\.09/);
  assert.match(html, /2022\.09[^<]*2024\.01/);
  assert.doesNotMatch(lemonSection, /걸음수 랭킹 집계 성능 개선|약 10분에서 1분 이하로 단축/);
  assert.match(lemonSection, /<h3>걷기 챌린지<\/h3>/);
  const walking = lemonSection.slice(lemonSection.indexOf('<h3>걷기 챌린지</h3>'), lemonSection.indexOf('<h3>리워드 시스템</h3>'));
  assert.match(walking, /<h4>걸음수 랭킹 시스템<\/h4>/);
  assert.match(walking, /개인, 팀, 친구, 연간 랭킹 개발/);
  assert.match(lemonSection, /<h3>리워드 시스템<\/h3>/);
  assert.match(lemonSection, /걸음수 분 단위 집계 기능/);
  assert.match(lemonSection, /Spring Batch 기반 챌린지 정산/);
  assert.doesNotMatch(lemonSection, /한정 수량 리워드와 티켓 지급에는 DB 비관적 락/);
  assert.match(html, /AdMob SSV/);
  assert.doesNotMatch(lemonSection, /Blue\/Green|Jenkins|Helm|Argo CD|운영 배포/);
  assert.match(lemonSection, /여러 서비스에서 반복 사용하는 백엔드 기능을 공통 모듈로 개발/);
  assert.match(lemonSection, /Security, RSA, AES, SHA, UUID, File, Redis, FCM, Excel, CSV, Kafka/);
  assert.match(lemonSection, /공식 걷기대회/);
  assert.match(lemonSection, /Spring Batch 기반 챌린지 정산/);
  assert.match(lemonSection, /FCM 발송 실패 원인 분류/);
  assert.match(lemonSection, /NAS 기반 파일 저장 구조를 NCP Object Storage로 전환/);
  assert.doesNotMatch(lemonSection, /AWS S3|\bS3\b/);
  assert.doesNotMatch(html, /재직 중|CURRENT · HEALTHCARE PLATFORM|CAREER DOCUMENT/);
  assert.doesNotMatch(html, /class="career-brand"|class="header-contact"/);
  assert.doesNotMatch(html, /회사명을 선택하면 해당 경력으로 이동합니다/);
  assert.doesNotMatch(html, /class="contents"|class="work-number"/);
  assert.doesNotMatch(html, /deck-controls|data-deck|assets\/nav\.js/);
});

test("portfolio keeps direct URL access and explains the moved cases", () => {
  const html = fs.readFileSync(path.join(root, "src/portfolio/index.html"), "utf8");
  assert.match(html, /<nav class="page-tabs"/);
  assert.match(html, /<a href="\.\.\/">경력기술서<\/a>/);
  assert.doesNotMatch(html, /포트폴리오<\/a>/);
  assert.doesNotMatch(html, /아직 작성된 프로젝트가 없습니다/);
  for (const id of ["ranking", "reward", "ssv", "push"]) {
    assert.match(html, new RegExp(`<article class="portfolio-case" id="${id}"`));
  }
  assert.match(html, /약 10분[^<]*1분 이하/);
  assert.match(html, /DB 비관적 락으로 지급 상태/);
  assert.match(html, /Redis 기반 락을 적용해 동시 요청/);
  assert.match(html, /Redis Lua Script로 요청을 제한/);
  assert.match(html, /토큰 제거를 비동기 트랜잭션으로 분리/);
  assert.doesNotMatch(html, /class="career-brand"|class="header-contact"/);
});

test("company summaries distinguish Lemon and Actbase work", () => {
  const html = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
  const lemon = html.slice(html.indexOf('id="lemon"'), html.indexOf('id="actbase"'));
  const actbase = html.slice(html.indexOf('id="actbase"'), html.indexOf('id="zest"'));
  const zest = html.slice(html.indexOf('id="zest"'));

  assert.match(lemon, /class="service-feature service-feature--plain">\s*<p class="service-label">주요 업무<\/p>\s*<div class="service-body">\s*<p class="company-intro">/);
  assert.match(actbase, /class="service-feature service-feature--plain">\s*<p class="service-label">주요 업무<\/p>\s*<div class="service-body">\s*<p class="company-intro">/);
  assert.match(zest, /class="service-feature service-feature--plain">\s*<p class="service-label">참여 서비스<\/p>\s*<div class="service-body">\s*<p class="company-intro">/);
  assert.match(lemon, /Core\/Common 공통 모듈을 개발하고 청구의신, 건강의신 서비스 백엔드 업무에 참여/);
  assert.doesNotMatch(lemon, /class="service-detail|src="assets\/health-god-app-icon|apps\.apple\.com|play\.google\.com/);
  assert.match(actbase, /포토몬 비즈프린트와 풀무원 녹즙 사이트의 백엔드 개발 및 운영 업무/);
  assert.doesNotMatch(actbase, /class="service-detail|src="assets\/photomon-bizprint-logo|https:\/\/biz\.photomon\.com/);
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
  assert.match(career, /href="assets\/career\.css\?v=20260922-6"/);
  assert.match(portfolio, /href="\.\.\/assets\/career\.css\?v=20260922-6"/);
  assert.ok(fs.existsSync(path.join(root, "dist/assets/career.css")));
});

test("introduction leads into a grouped technology overview before experience", () => {
  const html = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
  assert.match(html, /데이터로 판단하고, 시스템을 이해하며, 사람을 위한 서비스를 만듭니다/);
  assert.match(html, /근거 없는 가정보다 데이터를 바탕으로 문제를 판단하고, AI가 작성한 코드도 직접 검토하며 구조와 동작을 이해한 뒤 개발하는 것을 중요하게 생각합니다/);
  assert.match(html, /기술과 사용자 경험을 함께 고민하고 있습니다/);
  assert.ok(html.indexOf('class="career-hero"') < html.indexOf('class="skills-overview"'));
  assert.ok(html.indexOf('class="skills-overview"') < html.indexOf('class="experience-overview"'));
  for (const technology of ["Spring Boot", "Spring Batch", "PostgreSQL", "MongoDB", "Redis", "Kafka", "NCP Object Storage", "GitLab CI"]) {
    const skills = html.slice(html.indexOf('class="skills-overview"'), html.indexOf('class="experience-overview"'));
    assert.ok(skills.includes(technology), `${technology} should appear in the skill overview`);
  }
});
