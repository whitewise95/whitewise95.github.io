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

test("career document has navigable company sections without an unconfirmed metric", () => {
  const html = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
  assert.match(html, /<a href="portfolio\/">포트폴리오<\/a>/);
  assert.match(html, /<a href="\.\/" aria-current="page">경력기술서<\/a>/);
  assert.match(html, /<a href="#lemon">레몬헬스케어<\/a>/);
  assert.match(html, /<a href="#actbase">액트베이스<\/a>/);
  assert.match(html, /<a href="#zest">제스트씨엔에스<\/a>/);
  assert.match(html, /<section[^>]*id="lemon"/);
  assert.match(html, /<section[^>]*id="actbase"/);
  assert.match(html, /<section[^>]*id="zest"/);
  assert.ok(html.indexOf('id="lemon"') < html.indexOf('id="actbase"'));
  assert.ok(html.indexOf('id="actbase"') < html.indexOf('id="zest"'));
  assert.doesNotMatch(html, /10분\s*(?:에서|→)\s*1(?:분|초)/);
  assert.doesNotMatch(html, /deck-controls|data-deck|assets\/nav\.js/);
});

test("career and portfolio pages share a built stylesheet", () => {
  const career = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
  const portfolio = fs.readFileSync(path.join(root, "src/portfolio/index.html"), "utf8");
  assert.match(career, /href="assets\/career\.css"/);
  assert.match(portfolio, /href="\.\.\/assets\/career\.css"/);
  assert.ok(fs.existsSync(path.join(root, "dist/assets/career.css")));
});
