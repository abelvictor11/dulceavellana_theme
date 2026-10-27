# Distributed Menu Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the existing informational-menu UI and Shopify visual-editor workflow while distributing its saved content across four independently limited section-group JSON files.

**Architecture:** A deterministic Node migration partitions the current menu at category boundaries and writes four custom section groups plus a lightweight page template. `theme.liquid` renders those groups only for `page.menu`; `menu-list.liquid` and a single shared JavaScript asset coordinate the instances into one heading, filter and continuous menu.

**Tech Stack:** Shopify Liquid, JSON templates and custom section groups, browser JavaScript, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-10-26-menu-storage-groups-design.md`

## Global Constraints

- Public cards, simple rows, modal, responsive layout, dietary indicators, estimated totals and three additions groups must remain visually and functionally equivalent.
- All content remains editable in Shopify's visual theme editor; no products, collections, metaobjects or external apps become data sources.
- `templates/page.menu.json` and every section-group JSON file must stay below Shopify's 512 KB hard limit.
- The migration target is 350 KB maximum per group and never splits a category from its following items.
- Existing block IDs, types, settings, order and section presentation settings must be preserved.
- This branch stays separate from PR #11 and must be rebased onto the latest `main` before its PR is opened.

## Review Focus

- A category unit larger than 350 KB must stop with a clear error and must not write partial output — Task 1 tests this.
- More content than four groups can hold must stop without overwriting the source template — Task 1 tests this.
- Items before the first category must remain ordered as one uncategorized unit — Task 1 tests this.
- Empty continuation groups must render no whitespace, duplicate heading or filter — Task 3 tests this contract.
- Theme-editor section reload/reorder events must rebuild one filter without duplicate listeners or buttons — Task 3 tests the initialization markers and event contract.

---

### Task 1: Safe menu-template migration utility

**Files:**
- Create: `scripts/migrate-menu-template.mjs`
- Create: `tests/menu-template-migration.test.mjs`

**Interfaces:**
- Consumes: a parsed `page.menu.json` object containing exactly one `menu-list` section.
- Produces: `splitMenuTemplate(template, { groupCount, targetBytes }) -> { template, groups, manifest }`, where `groups` is an ordered array of four section-group objects and `manifest` contains source/output block counts, ordered block IDs and byte sizes.
- Produces CLI: `node scripts/migrate-menu-template.mjs --source <page.menu.json> --theme-root <theme-dir> --backup-dir <dir>`.

- [ ] **Step 1: Write failing migration tests**

Add tests named `preserves every block and setting in order`, `keeps categories atomic including leading uncategorized items`, `rejects an oversized category before writing`, `rejects capacity beyond four groups before writing`, and `rejects already migrated or missing menu sources`. Assert a 350 KB target, four outputs, `custom.menu_content` types, stable block IDs/settings and no filesystem changes on validation errors.

- [ ] **Step 2: Run the focused tests and confirm red**

Run: `node --test tests/menu-template-migration.test.mjs`

Expected: FAIL because `scripts/migrate-menu-template.mjs` does not exist.

- [ ] **Step 3: Implement the pure partition and validation interface**

Implement `splitMenuTemplate` with UTF-8 byte counts from `Buffer.byteLength(JSON.stringify(value))`. Treat blocks before the first category as one unit; every category starts a unit containing all following items until the next category. Fill groups in order without exceeding `targetBytes`; validate all outputs before returning and throw descriptive errors for a missing source, a unit over target, more than four required groups, or any output at/above 512 KB.

- [ ] **Step 4: Implement the transactional CLI**

Parse the three required flags, read and validate before writing, copy the original template into `backup-dir`, then write the lightweight source template and `sections/menu-content-1.json` through `sections/menu-content-4.json`. Never mutate the source or create partial group files on validation failure.

- [ ] **Step 5: Run migration tests and commit**

Run: `node --test tests/menu-template-migration.test.mjs`

Expected: all migration tests PASS.

Commit: `feat(menu): add safe distributed storage migrator`

---

### Task 2: Generate the distributed Shopify data files

**Files:**
- Modify: `templates/page.menu.json`
- Create: `sections/menu-content-1.json`
- Create: `sections/menu-content-2.json`
- Create: `sections/menu-content-3.json`
- Create: `sections/menu-content-4.json`
- Modify: `tests/menu-informational.test.mjs`

**Interfaces:**
- Consumes: Task 1 CLI and the current repository `templates/page.menu.json`.
- Produces: four valid section groups named `Menú · Parte 1` through `Menú · Parte 4`, each type `custom.menu_content`; the first group owns the current seed content and primary presentation settings, empty groups remain valid continuations.

- [ ] **Step 1: Add failing structural and size tests**

Assert that the page template no longer embeds a `menu-list`, exactly four group files exist, each has the expected `type` and one `menu-list` section, all group/template files are below 512 KB, all migrated block IDs/settings/order equal the former seed data, and exactly one group uses `segment_role: primary`.

- [ ] **Step 2: Run the focused test and confirm red**

Run: `node --test tests/menu-informational.test.mjs tests/menu-template-migration.test.mjs`

Expected: FAIL because the four group files do not exist and the page template still contains the menu.

- [ ] **Step 3: Run the migrator against the repository seed**

Use a temporary backup directory outside the repository. Verify the manifest reports identical input/output block counts and ordered IDs. Set groups 2–4 to `segment_role: continuation`; do not commit the temporary backup.

- [ ] **Step 4: Validate generated JSON and tests**

Run: `jq empty templates/page.menu.json sections/menu-content-1.json sections/menu-content-2.json sections/menu-content-3.json sections/menu-content-4.json`

Run: `node --test tests/menu-informational.test.mjs tests/menu-template-migration.test.mjs`

Expected: valid JSON and all focused tests PASS.

- [ ] **Step 5: Commit**

Commit: `feat(menu): distribute content across section groups`

---

### Task 3: Present all menu segments as one interface

**Files:**
- Create: `assets/menu-list.js`
- Modify: `sections/menu-list.liquid`
- Modify: `tests/menu-informational.test.mjs`

**Interfaces:**
- Consumes: four rendered `menu-list` roots marked `data-menu-segment="primary|continuation"`.
- Produces: global `window.DulceAvellanaMenu.init(scope)`; one primary heading/filter; filter buttons generated from every `[data-menu-category]`; per-section modal/gallery/calculator behavior; idempotent theme-editor event handling.

- [ ] **Step 1: Add failing multi-segment contract tests**

Assert the schema exposes `segment_role`, continuation markup suppresses intro/filter/empty-state spacing, every category exposes its visible label in a data attribute, the shared asset is loaded once, and it listens for `DOMContentLoaded`, `shopify:section:load`, `shopify:section:unload`, `shopify:section:reorder` and block selection without duplicating initialization.

- [ ] **Step 2: Run the focused test and confirm red**

Run: `node --test tests/menu-informational.test.mjs`

Expected: FAIL on missing multi-segment contracts.

- [ ] **Step 3: Extract and generalize the menu controller**

Move the existing dialog, gallery, additions, focus-trap and price behavior from the inline script to `assets/menu-list.js`. Scope local interactions to their segment, but rebuild the primary filter from all menu categories in document order. Use dataset initialization flags and one global event-registration flag so editor reloads remain idempotent.

- [ ] **Step 4: Add segment rendering behavior without changing cards**

Add `segment_role` with `primary` and `continuation` options. Primary renders intro/filter; continuation omits them and removes outer top spacing. Preserve block markup, section-qualified IDs, responsive CSS and `block.shopify_attributes`. Empty continuation sections output no visible placeholder outside design-mode guidance.

- [ ] **Step 5: Run tests and visual smoke checks**

Run: `node --test tests/menu-informational.test.mjs tests/menu-template-migration.test.mjs`

Expected: all focused tests PASS.

Render representative primary and continuation fragments at desktop and mobile widths. Verify one heading/filter, uninterrupted category order, no empty-group gap, working modal controls and visible Shopify editor block outlines.

- [ ] **Step 6: Commit**

Commit: `feat(menu): unify distributed menu segments`

---

### Task 4: Render custom groups only on the menu page and complete validation

**Files:**
- Modify: `layout/theme.liquid`
- Modify: `tests/menu-informational.test.mjs`
- Modify: `docs/superpowers/specs/2026-10-26-menu-storage-groups-design.md` only if implementation reveals an approved factual correction.

**Interfaces:**
- Consumes: section groups from Task 2 and controller contract from Task 3.
- Produces: a `data-menu-page` wrapper containing the four `{% sections 'menu-content-N' %}` renders only when `template.name == 'page'` and `template.suffix == 'menu'`; all other templates preserve their current layout path.

- [ ] **Step 1: Add failing layout isolation tests**

Assert all four literal `sections` tags appear inside the menu-template condition, `content_for_layout` remains present for every page, non-menu templates do not render menu groups, and the wrapper provides the controller scope.

- [ ] **Step 2: Run the full tests and confirm red**

Run: `node --test tests/*.test.mjs`

Expected: FAIL on the missing conditional group integration.

- [ ] **Step 3: Add the conditional group renders**

Place the wrapper and four literal group tags adjacent to `content_for_layout` without duplicating header/footer or changing non-menu page markup. Do not dynamically construct section-group names because Shopify's `sections` tag requires literals.

- [ ] **Step 4: Validate the complete theme change**

Run: `node --test tests/*.test.mjs`

Run: `jq empty templates/page.menu.json sections/menu-content-1.json sections/menu-content-2.json sections/menu-content-3.json sections/menu-content-4.json`

Run: `shopify theme check`

Run the Shopify Liquid full-theme validator for every created/modified theme file. Expected: no new errors; document inherited warnings separately.

- [ ] **Step 5: Rebase onto current main and rerun verification**

Fetch `origin/main`. Ensure PR #11 is present in `main`; if it is not, stop before PR creation rather than duplicating its files or commits. Rebase the branch, rerun the full test/JSON/theme-check suite, and confirm `git diff --name-status origin/main...HEAD` contains only this adjustment's design, plan, script, tests, asset, section groups, template, layout and `menu-list` changes.

- [ ] **Step 6: Verify remote-content migration readiness**

Pull or obtain the current theme's `page.menu.json`, make a timestamped backup, run the migrator into a temporary theme copy, and compare the manifest. Do not deploy or merge if the remote source cannot be obtained or if any block/settings hash differs.

- [ ] **Step 7: Commit final integration**

Commit: `feat(menu): render distributed menu storage`

---

### Task 5: Final review and new pull request

**Files:**
- Review all files changed from `origin/main`.

**Interfaces:**
- Consumes: verified Tasks 1–4 branch.
- Produces: one new GitHub PR targeting `main`, separate from PR #11, containing only files required by this storage adjustment.

- [ ] **Step 1: Review migration safety and UI regressions**

Check transactional writes, byte calculations, category boundaries, empty groups, unique IDs, keyboard/modal behavior, editor events and non-menu layout isolation. Resolve every Critical or Important finding before continuing.

- [ ] **Step 2: Run fresh final verification**

Run the full test, JSON, `git diff --check`, Theme Check and visual desktop/mobile checks again from the final commit.

- [ ] **Step 3: Push and open the PR**

Create a new branch PR to `main`. The description must state the migration prerequisite, list the exact files, report test results and explicitly warn that merging/deploying is blocked until the current remote menu has been backed up and migrated successfully.
