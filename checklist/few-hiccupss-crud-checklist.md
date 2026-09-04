# Exploratory Testing Checklist — FEW HICCUPSS + CRUD

## Purpose

This checklist is an **oracle**, not a script. It does not tell a tester which buttons to click; it gives a set of consistency heuristics for recognizing that something is *wrong* even when no written specification says so. A bug ("inconsistency") exists whenever the software fails to conform to one or more of the elements below.

The mnemonic FEW HICCUPSS was developed by tester Michael Bolton. Use it while exploring any page or flow: read each heuristic, then actively look for places the product under test violates it. A dedicated **Create-Read-Update-Delete (CRUD)** section follows, since almost every application has some form of persisted-data lifecycle worth probing directly.

For each item found, record: what you observed, which heuristic(s) it violates, how confident you are it's really a bug (vs. a matter of taste), and what evidence supports it (screenshot, URL, steps to reproduce).

---

## F — Familiarity

System behavior should be consistent with patterns the user is already accustomed to — both general software conventions and the product's *own* conventions used elsewhere on the same screen or in the same app.

- Do icons and controls that look alike (e.g. an X, a trash can, a gear) behave alike everywhere they appear?
- Is the logo a clickable link back to the homepage on every page, the way it conventionally is?
- Do interactive elements (buttons, links, cards) show the hover/focus/active affordance a user would expect, and do they show it *consistently* across the app?
- Does navigation (menu items, order, labels) stay the same from page to page, or does it silently rearrange?
- Do modals/dialogs close and cancel in the way every other modal in the app does?
- Would a user familiar with common web conventions (or with this app's other screens) be surprised by this screen's behavior?

## E — Explainability

System behavior must be logical and explicable. If you, the tester, cannot explain *why* the software produced a given result — or an end user couldn't understand the outcome without inside knowledge of the implementation — that's a defect signal.

- Does every error message identify what went wrong and, ideally, what to do about it — or is it generic ("Something went wrong")?
- Are raw technical/internal errors (stack traces, "undefined is not a function", raw HTTP status codes) ever exposed directly to the user?
- Can every number on the screen (a total, a fee, a count) be accounted for by something visible elsewhere on the screen?
- After an action completes, is it clear to the user whether it succeeded or failed — or is the outcome ambiguous?
- If you had to explain this exact behavior to a confused user in one sentence, could you do it without saying "that's just how the code works"?

## W — World

Software operates in, and must remain consistent with, the real world: physical law, arithmetic, calendars, currency, geography, and plain common sense.

- Do dates and times make logical sense (an arrival after a departure, an end after a start, no impossible durations)?
- Is currency/number formatting standard for its locale (correct decimal places, thousands separators, no impossible values)?
- Are units of measurement used correctly and consistently (not mixing kg and lbs, miles and km, without conversion or labeling)?
- Do computed/derived values (totals, ages, durations) match what you'd get doing the arithmetic yourself?
- Does anything on screen assert something that is simply, factually not true?

## H — History

The current version of the software should be consistent with its own past — both prior releases (unless a change was deliberate and communicated) and its own past statements on other screens.

- Does a feature that worked a certain way still work that way, or has it silently regressed?
- Do "since," "founded," "member since," or similar historical claims do the arithmetic correctly against today's date?
- Do timestamps like "last updated" or "last modified" actually update when the underlying data changes?
- Is versioned/dated content (copyright years, "current as of" notices) actually current, or hardcoded and stale?
- If a shortcut, setting, or default changed, would an existing user be surprised — and were they told?

## I — Image

The software should reflect the brand image, professionalism, and quality standard the organization is presenting elsewhere. Visual sloppiness undermines credibility even when nothing is technically "broken."

- Does every image actually load — no broken-image icons, no missing alt content standing in for a real image?
- Is the logo rendered at its correct aspect ratio and resolution everywhere it appears, not stretched, squashed, or pixelated?
- Is visual consistency (color palette, spacing, corner radius, type) maintained across every page, or does one page look like it belongs to a different product?
- Are there spelling, grammar, or punctuation errors, especially in prominent or legally/financially significant text?
- Would you be comfortable if a prospective customer's first impression of the brand came from this exact screen?

## C — Comparable Products

The product should hold up against direct competitors and industry-standard alternatives — and, just as importantly, against *itself* (its own other pages/screens performing an equivalent task).

- Does a core capability that competitors offer as standard exist here at all?
- Does an equivalent action (e.g. "save," "cancel," "delete") work the same way on every screen that offers it, or does one screen's version behave differently from another's?
- If a component (button, card, form field) appears on multiple screens, does it look and behave identically everywhere, or has one instance drifted (a different shade, a different radius, a missing state)?
- Would a user who has used comparable products in this domain find this workflow unusually slow, limited, or awkward?

## C — Claims

The system must live up to every promise made about it — formal requirements, user stories, marketing copy, on-screen help text, tooltips, confirmation dialogs, and legal/SLA language all count as claims.

- Does marketing copy on the page match what the feature actually does when you use it?
- Does a confirmation dialog's description of what's about to happen (e.g. "archived," "reversible," "sent immediately") match what actually happens afterward?
- Do two claims about the same fact, made on two different pages of the same product, agree with each other?
- Does help text, a tooltip, or a placeholder describe the field's actual accepted format/behavior?
- If you did exactly what the on-screen text told you to expect, would the result match?

## U — User Expectations

The system should satisfy what the target persona reasonably expects when trying to accomplish their goal — regardless of what a written spec does or doesn't say.

- Does "Cancel" actually discard changes, and does "Save"/"Submit" actually persist them — never the reverse or the same handler for both?
- Does a toggle/checkbox's stored state match what its visible label says it means (not inverted)?
- Does data the user entered survive an accidental navigation, tab switch, or refresh where a reasonable user would expect it to (e.g. a cart, a draft)?
- Do sort/filter controls actually produce the order/subset their label promises (e.g. "Price: Low to High" truly ascending)?
- Would a first-time user, with no special knowledge, complete the task the way the design intends — or would they get stuck, confused, or fooled into the wrong action?

## P — Purpose

Every feature, button, field, and screen should directly or indirectly serve the product's core reason for existing. A feature that doesn't serve its stated purpose — or actively obstructs it — is a defect even if it "works" technically.

- Does clicking/submitting a control actually do the thing its label promises, or does it silently no-op?
- Is a control present and visible but not actually wired to anything (dead search box, dead link, dead button)?
- Does the primary path to the user's main goal require unnecessary steps, fields, or friction that don't serve the goal?
- If this feature were removed entirely, would the product still accomplish what the user came here to do — and if the feature is core, does it actually deliver on that?

## S — Statutes / Standards

The product must comply with applicable laws, regulations, and industry/accessibility standards — WCAG, data-protection law, payment-industry rules, and any domain-specific regulation.

- Does every form input have a properly associated label (not placeholder text standing in for a label)?
- Does text meet minimum contrast ratios (WCAG AA) against its background?
- Can every interactive control be operated by keyboard alone, with visible focus indication?
- Do images convey their meaning to a screen reader (meaningful `alt` text, not empty or decorative-only where the image is informative)?
- Where applicable: is there a mechanism for consent, data access, or data deletion where regulation requires one?

---

## CRUD Checklist

Almost every meaningful feature is really a Create/Read/Update/Delete lifecycle around some piece of data. Test each phase directly, and test the *transitions* between them — most real defects live at the seams.

### Create
- Are required fields actually enforced, both in the client (immediate feedback) and on the server (not just trusted from the client)?
- Are field types/formats validated (no negative price, no text in a numeric field, no impossible date)?
- If the server reports success, is the record *actually* persisted — re-read it back rather than trusting the response body?
- Does the new record actually appear wherever a user would expect to find it afterward (a list, a search result, a dashboard count)?

### Read
- Do the list view and the detail view agree with each other for the same record?
- Do search, filter, sort, and pagination controls actually do what their labels claim, and do they compose correctly together?
- What happens on a read of something that doesn't exist, or that the user isn't allowed to see — a clear state, or a confusing error/blank page?
- Is a large or empty result set handled gracefully (no broken pagination math, no silently-truncated results)?

### Update
- Does editing a record change *that* record, and only that record (watch for id-vs-position mix-ups)?
- Is there a race condition on rapid or double submission (a lost update, a duplicate write)?
- Do "last modified"/"last updated" fields actually reflect a real update?
- Does the UI clearly confirm whether the update succeeded or failed, rather than leaving the user guessing?

### Delete
- Is the user given an accurate description of what deletion means (permanent vs. recoverable) — and does actual behavior match that description?
- Once deleted, is the record actually gone from *every* view, including cached/list views that might not auto-refresh?
- Are there orphaned references left behind elsewhere in the app after a delete?
- Is there any way to recover from an accidental delete if the UI implied there would be?
