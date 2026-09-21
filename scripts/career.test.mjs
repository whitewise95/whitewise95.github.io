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
  assert.match(html, /2024\.09[^<]*재직 중/);
  assert.match(html, /2022\.09[^<]*2024\.01/);
  assert.match(html, /약 10분[^<]*1분 이하/);
  assert.match(html, /AdMob SSV/);
  assert.match(html, /Blue\/Green 배포/);
  assert.doesNotMatch(html, /class="contents"|class="work-number"/);
  assert.doesNotMatch(html, /deck-controls|data-deck|assets\/nav\.js/);
});

test("career and portfolio pages share a built stylesheet", () => {
  const career = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
  const portfolio = fs.readFileSync(path.join(root, "src/portfolio/index.html"), "utf8");
  assert.match(career, /href="assets\/career\.css"/);
  assert.match(portfolio, /href="\.\.\/assets\/career\.css"/);
  assert.ok(fs.existsSync(path.join(root, "dist/assets/career.css")));
});
