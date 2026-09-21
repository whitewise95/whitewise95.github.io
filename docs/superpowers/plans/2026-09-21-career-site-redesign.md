# Career Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a readable Korean career document at `/` and an empty portfolio tab at `/portfolio/`.

**Architecture:** Keep the static GitHub Pages build. Source HTML lives in `src/`, a focused stylesheet owns the two personal pages, and `scripts/build.js` copies the new portfolio route to both `dist/` and the branch publication root. Navigation uses normal links and anchors.

**Tech Stack:** HTML, CSS, Node.js build script and Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-21-career-site-redesign-design.md`

## Global Constraints

- Public copy must only use facts present in the shared conversation, current page, or repository history.
- Do not publish the conflicting walking aggregation improvement number without user confirmation.
- `/portfolio/` is an empty state with no case studies.
- Keep existing service and legal URLs working.
- No browser runtime dependency is needed for the career document and tab navigation.

## Review Focus

- Direct loading of `/portfolio/` from the branch publication root must show the placeholder.
- Tabs must be navigable by keyboard and expose the current page.
- Career section anchors must land on their matching company.
- Narrow screens must keep the reading column and tab links usable.
- Printed pages must remove navigation and keep company and work headings with their content.

---

### Task 1: Publish the second route

**Files:**
- Modify: `scripts/build.js`
- Modify: `package.json`
- Create: `src/portfolio/index.html`
- Create: `scripts/career.test.mjs`

**Interfaces:**
- Produces: `/portfolio/` as a real static route with a link back to `/`.

- [ ] **Step 1: Write the failing route test.** Add a Node test that runs the build script and asserts that `dist/portfolio/index.html` and `portfolio/index.html` both exist, and that the portfolio page has a link to `../` with `aria-current="page"` on its own tab.
- [ ] **Step 2: Run `node --test scripts/career.test.mjs`; verify it fails because the route is absent.**
- [ ] **Step 3: Add `portfolio` to the branch publication copy list in `scripts/build.js`; create the minimal accessible placeholder HTML with two tabs. Add the new test file to the `npm test` command.**
- [ ] **Step 4: Run the focused test and `npm test`; verify all pass.**
- [ ] **Step 5: Commit route and test.**

### Task 2: Replace the slide deck with the career document

**Files:**
- Modify: `src/index.html`
- Modify: `scripts/career.test.mjs`

**Interfaces:**
- Consumes: `/portfolio/` from Task 1.
- Produces: semantic company sections at `#lemon`, `#actbase`, and `#zest` and a top navigation link to `portfolio/`.

- [ ] **Step 1: Add failing tests for the two tabs, current-page marker, company anchor destinations, ordered company names, and absence of the contradictory exact metric.** Use source HTML as the test input so failures identify missing content and invalid route relationships.
- [ ] **Step 2: Run `node --test scripts/career.test.mjs`; verify the document test fails against the slide deck.**
- [ ] **Step 3: Rewrite `src/index.html` as a natural-scroll career document. Write the recent company in greatest detail, and the older two more briefly. Use only source-supported claims. Keep the brief introduction, table of contents, and contact links. Remove slide controls and the deck script.**
- [ ] **Step 4: Run focused and full tests; verify all pass.**
- [ ] **Step 5: Commit the content and structure.**

### Task 3: Apply the new visual system and print layout

**Files:**
- Create: `src/assets/career.css`
- Modify: `src/index.html`
- Modify: `src/portfolio/index.html`

**Interfaces:**
- Consumes: semantic page structures from Tasks 1 and 2.
- Produces: shared typography, colors, spacing, responsive layout, visible focus, and print rules.

- [ ] **Step 1: Add a focused test that both pages load `assets/career.css` using the correct relative path and that the built CSS file exists. Run it and watch it fail.**
- [ ] **Step 2: Implement `career.css` with warm light background, dark ink, one blue accent, desktop contents rail, mobile one-column flow, and print styles. Link it from both pages.**
- [ ] **Step 3: Run focused and full tests and `npm run build`; verify all pass.**
- [ ] **Step 4: Inspect the built pages at desktop and mobile widths plus print preview. Correct any visible issue and re-run verification.**
- [ ] **Step 5: Commit visual changes.**

### Task 4: Final verification and publication

**Files:**
- Verify: `src/index.html`, `src/portfolio/index.html`, `src/assets/career.css`, built copies, and the approved spec.

**Interfaces:**
- Consumes: all earlier tasks.
- Produces: verified branch publication files.

- [ ] **Step 1: Run `npm run build`, `npm test`, `npm run check:publish`, and `git diff --check`; inspect every result.**
- [ ] **Step 2: Verify both direct URLs locally, keyboard tab order, three company anchors, and the placeholder.**
- [ ] **Step 3: Review the diff against the spec; resolve any substantive gap and repeat the relevant check.**
- [ ] **Step 4: Commit generated publication files if changed, then push the branch the user authorized.**
