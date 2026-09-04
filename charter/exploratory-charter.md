# Exploratory Testing Charter — WidgetWorks

*Standard Session-Based Test Management (SBTM) charter format.*

## Mission

Explore WidgetWorks to uncover usability, consistency, functional, accessibility, and data-integrity defects, using the [FEW HICCUPSS + CRUD checklist](../checklist/few-hiccupss-crud-checklist.md) as the oracle for what counts as a problem when no formal specification covers it.

## Background

WidgetWorks is a small business inventory catalog (see the [product description](../app-spec/test-app-description.md) for full context): shop owners manage a widget catalog through Create/Read/Update/Delete operations, and prospective customers browse the catalog and make contact. The product has one canonical visual identity, represented by the **Home** page, which every other page is expected to match.

## Scope

**In scope:**
- All pages reachable from the primary navigation: Home, Catalog, Item detail, New item, Edit item, Account, Contact, About.
- The full Create/Read/Update/Delete lifecycle for catalog items.
- Visual and brand consistency of every page against the Home page.
- Client-side and server-side behavior for every form (validation, error handling, success/failure feedback).
- Accessibility of interactive controls and content.
- Consistency of claims (marketing copy, help text, confirmation dialogs) against actual behavior, both within a page and across pages.

**Out of scope (explicitly):**
- Performance and load testing.
- Security penetration testing (auth bypass, injection attacks, etc.).
- Cross-browser/cross-device compatibility matrix — testing is against a single modern desktop browser.
- Any third-party integration testing (none exist in this version).

## Target Areas

| Area | Heuristic emphasis |
|---|---|
| Home (reference page) | Establishes the baseline for Familiarity, Image, Comparable Products — should require no findings itself |
| Catalog | Purpose, User Expectations, Statutes/Standards, CRUD-Read |
| Item detail | World, Explainability, CRUD-Read |
| New item | Statutes/Standards, User Expectations, CRUD-Create |
| Edit item | User Expectations, Explainability, CRUD-Update/Delete |
| Account | Explainability, History, Comparable Products |
| Contact | Purpose, Claims, Statutes/Standards |
| About | Claims, History, World |

## Approach

Deterministic, evidence-first exploration: capture objective evidence per page (screenshots, DOM structure, console/network activity, accessibility scan results, extracted visible text) before drawing any conclusions. Judgement-based heuristics (Familiarity, Explainability, Claims, User Expectations, Purpose, Comparable Products, Image) are then assessed against that fixed evidence, cross-referencing the checklist and this charter — not by re-browsing the live site, and not by guessing.

## Oracle

The [FEW HICCUPSS + CRUD checklist](../checklist/few-hiccupss-crud-checklist.md) is the primary oracle. The Home page serves as the reference oracle for brand/visual consistency specifically.

## Timebox

One exploration session per full pass of the in-scope pages. Budget roughly 10–15 minutes of session-equivalent effort per page (evidence capture + review), with an additional cross-page synthesis pass at the end of the session to catch inconsistencies that only appear when comparing pages to each other.

## Risks / Assumptions

- Seed data is limited and may not exercise every edge case (large numbers of items, unusual characters, extreme values) — findings are bounded by what the seed data actually surfaces.
- This is a single exploration pass; it is not exhaustive regression coverage and should not be treated as a substitute for scripted regression tests on confirmed defects.

## Roles

- **Charter author:** human tester (this document).
- **Session executor:** the exploratory-tester tool, operating without access to any list of known/expected defects.
