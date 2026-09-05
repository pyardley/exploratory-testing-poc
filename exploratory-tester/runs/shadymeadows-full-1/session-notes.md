# Exploratory Test Session Notes

**Charter:** [exploratory-charter.md](C:\Users\PaulYardley\Projects\ExporitoryTesting\charter\exploratory-charter.md)  
**Tester:** exploratory-tester (deterministic scanners + `claude -p` static-artifact review, model: sonnet)  
**Target:** http://localhost  
**Golden reference:** http://localhost/  
**Session date/time:** 2026-09-05T13:18:06.987Z  
**Pages covered:** 7

## Session Summary

This session covered the Shady Meadows B&B / Restful Booker platform across seven pages: the home page, the admin login, the cookie policy, the privacy policy, and three reservation detail pages reached directly from the home page's "Book now" buttons. The most critical functional finding is that the entire booking conversion path is broken end-to-end: every "Book now" CTA on the home page links to a reservation detail page that fails with a bad API response and renders nothing but an infinite spinner with no error recovery. Legal compliance is also a serious concern: the Cookie Policy and Privacy Policy both reference the wrong data controller, and they name *different* wrong entities (Automation in Testing Online vs MW Test Consultancy), meaning two legal documents on the same site contradict each other about who operates it. The admin area surfaces as a completely different product shell with its own brand ("Restful Booker Platform Demo") and navigation structure — visible only when compared against any other page. Across all seven pages, the `<title>` element is never customized per route, and shared footer components carry repeating WCAG AA contrast and accessible-name failures. Taken together, the site has a foundational identity and platform-configuration problem layered beneath a set of specific but severe functional, accessibility, and content defects.

### Prioritized issues

1. CRITICAL — End-to-end booking path is fully broken: all three home-page 'Book now' CTAs link to /reservation/1, /reservation/2, /reservation/3, and every one of those pages fails with a bad API response, producing only an infinite spinner with no error message and no recovery path. The site's primary purpose — allowing a user to book a room — is completely non-functional.
1. HIGH — Legal pages name contradictory wrong data controllers: the Cookie Policy body names 'Automation in Testing Online' while the Privacy Policy body names 'MW Test Consultancy' at automationintesting.online. Neither is correct (Shady Meadows B&B should be the controller), and the two pages actively contradict each other — a compliance, brand, and legal-accuracy failure on the site's most legally significant pages.
1. HIGH — Admin page is an entirely different product shell: the /admin navbar brand reads 'Restful Booker Platform Demo' with a different layout, color scheme, and nav items from every other page on the site. This is consistent with a deployment misconfiguration where a different application template is serving at /admin.
1. HIGH — Privacy Policy content is rendered client-side only: the /privacy DOM and extracted text contain only the homepage shell; the policy appears as a JS-injected overlay. Users without JavaScript, screen readers that read the initial document outline, and search engines see no privacy policy content whatsoever.
1. HIGH — 'Amenities' nav link targets a non-existent section: href='/#amenities' points to an element that does not exist on the page. All users who click this nav item are silently left at the top of the page with no feedback. Navigation makes a promise the page cannot keep.
1. HIGH — Booking form labels are programmatically disconnected from their inputs: the Check In and Check Out date inputs inside the react-datepicker wrapper carry no id attribute, so their labels (for='checkin', for='checkout') reference nothing. The contact form Message label (for='message') targets a textarea with id='description'. Both are confirmed WCAG critical violations.
1. HIGH — All three room card images carry alt='Single Room' regardless of room type: room2.jpg (Double) and room3.jpg (Suite) both have the same wrong alt text as the Single room. Screen reader users are told every room is a Single Room, directly contradicting visible card headings.
1. MEDIUM — 'Logout' button displayed on the admin login page before any authentication has occurred: the button is logically incoherent at this state, and its foreground/background color combination (3.4:1) also fails WCAG AA contrast — a double failure on the same control.
1. MEDIUM — Page <title> is never customized for any route: all seven pages in this session share the title 'Restful-booker-platform demo' and meta description 'A platform for testing restful web services'. Browser tab identification, bookmarks, screen reader announcements, and search-engine snippets are indistinguishable across the whole site.
1. MEDIUM — 'Getting Here' section on the home page contains the same marketing hero copy that appears in the hero section and the footer, instead of any wayfinding directions. The section heading sets a clear user expectation that is completely unmet.
1. MEDIUM — Shared footer carries systemic WCAG AA violations on every page: four footer links fail contrast (3.42:1 vs 4.5:1 required), and three social-media icon buttons have no accessible name at all (confirmed link-name violations). All three social links also resolve to href='#'. Because these are in a shared component, fixing them once fixes them everywhere.
1. LOW — All three room description paragraphs are Lorem Ipsum placeholder text. No real room description is present for any room type, undermining brand credibility for any visitor who reads the cards.

### Cross-page findings

- **[🔴 high, confidence: high]** Every 'Book now' button on the home page room cards links to /reservation/1, /reservation/2, and /reservation/3. All three destination pages fail identically: a bad API response produces an infinite Bootstrap spinner with no error message, no retry control, and no fallback UI. The home page presents a credible, functional-looking booking flow; the destination pages prove it is completely non-functional. Neither page alone reveals the full failure — you need both to see that the primary conversion path of the site is end-to-end broken. _(source: ai)_
  - Pages: http://localhost (home — room card 'Book now' links), http://localhost/reservation/1?checkin=2026-09-05&checkout=2026-09-06, http://localhost/reservation/2?checkin=2026-09-05&checkout=2026-09-06, http://localhost/reservation/3?checkin=2026-09-05&checkout=2026-09-06
- **[🔴 high, confidence: high]** The Cookie Policy body repeatedly names 'Automation in Testing Online' as the data controller. The Privacy Policy body names 'MW Test Consultancy' at 'https://automationintesting.online' as the data controller. Both are wrong (the site is Shady Meadows B&B), but they name *different* wrong entities. Two legal pages on the same site cannot agree on who is responsible for user data — a direct factual contradiction between pages that neither page alone reveals. _(source: ai)_
  - Pages: http://localhost/cookie, http://localhost/privacy
- **[🔴 high, confidence: high]** The admin page renders a completely different navbar brand — 'Restful Booker Platform Demo' in a dark Bootstrap navbar with nav items ['Restful Booker Platform Demo', 'Front Page', 'Logout'] — while every other page in the session renders 'Shady Meadows B&B' in a white navbar with items ['Rooms', 'Booking', 'Amenities', 'Location', 'Contact', 'Admin']. Confirmed by comparing admin DOM against cookie/home DOM snapshots. The admin shell appears to be an entirely different application template, not a themed admin view of the same product. _(source: ai)_
  - Pages: http://localhost/admin, http://localhost (home), http://localhost/cookie
- **[🟠 medium, confidence: high]** Every page in this session — home, admin, cookie, privacy, reservation/1, reservation/2, reservation/3 — carries exactly the same `<title>Restful-booker-platform demo</title>` with the same meta description 'A platform for testing restful web services'. No route sets a per-page title. Confirmed across all seven DOM snapshots. A user with multiple tabs open (e.g. browsing rooms, viewing a reservation, then returning to the home page) cannot distinguish tabs; screen readers announce the same identity on every page load; bookmarks are indistinguishable. _(source: ai)_
  - Pages: http://localhost (home), http://localhost/admin, http://localhost/cookie, http://localhost/privacy, http://localhost/reservation/1?checkin=2026-09-05&checkout=2026-09-06, http://localhost/reservation/2?checkin=2026-09-05&checkout=2026-09-06, http://localhost/reservation/3?checkin=2026-09-05&checkout=2026-09-06
- **[🟠 medium, confidence: high]** The footer social-media icon buttons (Facebook, Instagram, Twitter) are identically broken across every page that shares the footer shell: all three use href='#', have no visible text, no aria-label, and no title attribute. Confirmed in DOM snapshots for the home page and the cookie page (which mirrors the home shell). This is a shared component defect reproduced on every page with the standard layout — not an isolated oversight on one page. The pattern is also true of the footer 'Quick Links' column (all four links href='#') and the four footer text links that fail WCAG AA contrast (3.42:1 vs 4.5:1 required). _(source: ai)_
  - Pages: http://localhost (home), http://localhost/cookie, http://localhost/privacy

## Findings by Heuristic

### Familiarity

- **[🟠 medium, confidence: high]** Navigation items/order (["Restful Booker Platform Demo","Front Page"]) differ from the golden reference (["Shady Meadows B&B","Rooms","Booking","Amenities","Location","Contact","Admin"]). _(source: deterministic)_
  - Page: http://localhost/admin
- **[🟠 medium, confidence: high]** The footer "Quick Links" column lists Home, Rooms, Booking, and Contact — all pointing to `href="#"`. Unlike the main nav's anchor hrefs (e.g. `/#rooms`), these links are true dead stubs that scroll to the page top on every click. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: dom-snapshot.html (footer Quick Links ul)
  - Open question/risk: Users who click a footer quick link expect to jump to the relevant section; they instead stay at the top with no feedback. Comparable footers on comparable sites navigate correctly.
- **[🟡 low, confidence: high]** The header nav includes Rooms, Booking, Amenities, Location, Contact, and Admin. The footer Quick Links include only Home, Rooms, Booking, and Contact — omitting Amenities, Location, and Admin, while adding Home. The two navigation surfaces are inconsistent with each other. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: dom-snapshot.html (navbar vs footer ul), text-content.txt lines 2–7 vs 88–91
  - Open question/risk: Users anchoring their mental model from the footer will miss Location and Admin; users who expect the footer to mirror the nav will be confused by the discrepancy.
- **[🔴 high, confidence: high]** The navbar brand reads 'Restful Booker Platform Demo' and the page <title> reads 'Restful-booker-platform demo' — an entirely different product name. The navigation items are ['Restful Booker Platform Demo', 'Front Page'] versus the golden reference's ['Shady Meadows B&B', 'Rooms', 'Booking', 'Amenities', 'Location', 'Contact', 'Admin']. No Shady Meadows branding, logo, or colour palette is present. _(source: ai)_
  - Page: http://localhost/admin
  - Evidence: pages/admin/screenshot-full.png, pages/admin/dom-snapshot.html — <a class="navbar-brand" href="/">Restful Booker Platform Demo</a>, manifest navDeviationsFromGolden
  - Open question/risk: Is this the wrong application entirely being served at /admin, or has the admin shell template accidentally inherited a different product's layout?
- **[🔴 high, confidence: high]** When the data fetch fails, the UI offers no error message, no retry button, and no fallback content whatsoever — only the perpetual spinner. The user cannot distinguish between a temporary network hiccup, a non-existent reservation ID, an authorization problem, or a server outage. _(source: ai)_
  - Page: http://localhost/reservation/2?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: screenshot-full.png (no error UI present), dom-snapshot.html (root-container contains only spinner markup, no error branch rendered)
  - Open question/risk: Silent failure violates Explainability: users cannot determine what went wrong or what to do next. A standard web convention (Familiarity) is to show an error state with a meaningful message and a recovery action (e.g. 'We couldn't load this reservation — go back to My Bookings').
- **[🟡 low, confidence: high]** The page <title> is 'Restful-booker-platform demo' — the underlying platform's generic name. It does not identify the page as the Cookie Policy or associate it with the Shady Meadows B&B brand. _(source: ai)_
  - Page: http://localhost/cookie
  - Evidence: manifest — title: 'Restful-booker-platform demo', pages/cookie/dom-snapshot.html — <title>
  - Open question/risk: Poor for SEO, screen-reader context, and browser tab identification; a user with multiple tabs open cannot distinguish this tab from any other page on the site.

### Explainability

- **[🟠 medium, confidence: high]** 1 console error(s) logged during page load/interaction. _(source: deterministic)_
  - Page: http://localhost/reservation/1?checkin=2026-09-05&checkout=2026-09-06
- **[🟠 medium, confidence: high]** 1 console error(s) logged during page load/interaction. _(source: deterministic)_
  - Page: http://localhost/reservation/2?checkin=2026-09-05&checkout=2026-09-06
- **[🟠 medium, confidence: high]** 1 console error(s) logged during page load/interaction. _(source: deterministic)_
  - Page: http://localhost/reservation/3?checkin=2026-09-05&checkout=2026-09-06
- **[🔴 high, confidence: high]** A 'Logout' button is rendered in the navbar on the unauthenticated login page. The user has not yet signed in, so offering a logout action is logically incoherent and will confuse anyone who wonders whether they are already in a session. _(source: ai)_
  - Page: http://localhost/admin
  - Evidence: pages/admin/screenshot-full.png — Logout button visible in top-right nav, pages/admin/dom-snapshot.html — <button class="btn btn-outline-danger my-2 my-sm-0">Logout</button>
  - Open question/risk: Does the Logout button actually do anything from this state, and could it mislead a user into thinking they were previously logged in when they were not?
- **[🟠 medium, confidence: high]** Submitting the login form empty fires a network request to the server (networkRequestFiredOnEmptySubmit: true). There is no client-side validation preventing this, so the server is the only guard. An error indicator is shown afterward, but errorTextOnEmptySubmit is null — meaning the feedback is purely visual with no descriptive message to tell the user what went wrong or what is required. _(source: ai)_
  - Page: http://localhost/admin
  - Evidence: manifest formValidationFindings — networkRequestFiredOnEmptySubmit: true, errorIndicatorShown: true, errorTextOnEmptySubmit: null
  - Open question/risk: A screen-reader user or anyone unable to perceive the visual indicator receives no feedback at all. Additionally, the absence of a description forces the user to guess whether the problem was empty fields, wrong credentials, or a server error.
- **[🔴 high, confidence: high]** The page is stuck in a permanent loading state. The only DOM content is a Bootstrap spinner-border div; no reservation data, headings, or interactive elements ever rendered. The manifest records 1 console error, 1 page error, and 1 bad response, confirming the upstream data fetch failed. The user has no indication of what went wrong and no path to recover. _(source: ai)_
  - Page: http://localhost/reservation/1?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: screenshot-full.png (spinner only, blank page), dom-snapshot.html (spinner-border div, no reservation content), manifest: consoleErrorCount=1, pageErrorCount=1, badResponseCount=1, text-content.txt (empty)
  - Open question/risk: The reservation detail page is completely non-functional: a failed API call produces a permanent spinner instead of any content or error state. Users who arrive here (e.g. from a booking confirmation link) are silently blocked with no recourse.
- **[🔴 high, confidence: high]** When the data fetch fails there is no error message, no retry button, and no timeout. The spinner runs indefinitely. Users cannot tell whether the page is still loading, their reservation doesn't exist, or the service is down. _(source: ai)_
  - Page: http://localhost/reservation/1?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: screenshot-full.png, dom-snapshot.html
  - Open question/risk: Absence of any error or empty-state UI means the failure mode is completely silent to the user. Industry-standard practice is to surface a meaningful message ('We couldn't load your reservation — please try again or contact support') and a recovery action.
- **[🔴 high, confidence: high]** The page is completely non-functional: the React component never exits its loading state. The screenshot shows only a Bootstrap spinner; the text-content file is empty; headings and footer are absent. The manifest records one console error, one page error, and one bad API response — all consistent with a failed data fetch for reservation ID 2 that left the component hanging indefinitely. _(source: ai)_
  - Page: http://localhost/reservation/2?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: screenshot-full.png (spinner only), text-content.txt (empty), manifest: consoleErrorCount=1, pageErrorCount=1, badResponseCount=1, headings=[]
  - Open question/risk: Any user navigating to this reservation URL sees an infinite spinner with no content, no error message, and no path to recovery — the page's primary purpose (displaying reservation details) is completely blocked.
- **[🔴 high, confidence: high]** When the data fetch fails, the UI offers no error message, no retry button, and no fallback content whatsoever — only the perpetual spinner. The user cannot distinguish between a temporary network hiccup, a non-existent reservation ID, an authorization problem, or a server outage. _(source: ai)_
  - Page: http://localhost/reservation/2?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: screenshot-full.png (no error UI present), dom-snapshot.html (root-container contains only spinner markup, no error branch rendered)
  - Open question/risk: Silent failure violates Explainability: users cannot determine what went wrong or what to do next. A standard web convention (Familiarity) is to show an error state with a meaningful message and a recovery action (e.g. 'We couldn't load this reservation — go back to My Bookings').
- **[🔴 high, confidence: high]** Page never renders its content: the screenshot shows only a Bootstrap spinner, extracted text is empty, and the manifest records 1 bad API response, 1 console error, and 1 page error. The reservation detail for ID=3 could not be fetched, but the application silently spins rather than surfacing an error state. _(source: ai)_
  - Page: http://localhost/reservation/3?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: screenshot-full.png (spinner only, blank body), manifest: consoleErrorCount=1, pageErrorCount=1, badResponseCount=1, text-content.txt (empty)
  - Open question/risk: The CRUD-Read operation for reservation 3 fails and the application has no visible error recovery path — users are left with an indefinite spinner and no explanation of what went wrong or what to do next.
- **[🔴 high, confidence: high]** No error message, fallback state, or recovery path is shown when the data load fails. A user landing here — whether by direct link or back-navigation — has no indication whether the reservation doesn't exist, the server is down, or the URL is wrong. There is no retry control, no 'go back' prompt, and no explanation. _(source: ai)_
  - Page: http://localhost/reservation/3?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: screenshot-full.png (spinner is entire visible UI), dom-snapshot.html (no error branch rendered)
  - Open question/risk: Does the application have any error-boundary or fallback UI for failed reservation fetches, or is an endless spinner the only possible outcome of a bad response?
- **[🟡 low, confidence: medium]** The page `<title>` is 'Restful-booker-platform demo' — the application's global default, unchanged for this route. A browser tab, bookmark, or screen-reader page summary conveys nothing about the reservation being viewed. Good practice for a detail page is a title that includes the record identity (e.g. 'Reservation #3 | Shady Meadows'). _(source: ai)_
  - Page: http://localhost/reservation/3?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: dom-snapshot.html: <title>Restful-booker-platform demo</title>, manifest: title = 'Restful-booker-platform demo'
  - Open question/risk: Is the page title intentionally generic for this demo, or is dynamic title-setting per route simply not implemented?
- **[🟠 medium, confidence: high]** The three footer social-media icon buttons (Facebook, Instagram, Twitter) are keyboard-focusable but have no accessible name — no visible text, no aria-label, no title attribute. Screen-reader users cannot determine their purpose. _(source: ai)_
  - Page: http://localhost/cookie
  - Evidence: accessibilityViolations[1] — link-name, 3 nodes (.btn-outline-light:nth-child(1/2/3))
  - Open question/risk: Violates WCAG 2.4.4 Link Purpose (Level A) and 4.1.2 Name, Role, Value (Level A). A screen-reader user will encounter three anonymous focusable elements with no indication of where they lead.
- **[🟠 medium, confidence: high]** The <title> element site-wide is 'Restful-booker-platform demo'. On a legal page a user may bookmark or share, the title should identify the document (e.g., 'Privacy Policy | Shady Meadows B&B'). The generic platform title breaks user expectations and hides the page identity from screen readers on load. _(source: ai)_
  - Page: http://localhost/privacy
  - Evidence: pages/privacy/dom-snapshot.html — <title>Restful-booker-platform demo</title>
- **[🟠 medium, confidence: medium]** The heading scanner extracted only homepage headings with no 'Privacy Policy Notice' heading present, even though the screenshot shows that heading prominently. The privacy content appears injected by client-side JavaScript after initial render, meaning the heading is absent from the static document outline and may not be announced correctly to screen readers on page load. _(source: ai)_
  - Page: http://localhost/privacy
  - Evidence: manifest headings array — no privacy heading present, pages/privacy/screenshot-full.png — 'Privacy Policy Notice' visible at top

### World

- **[🟡 low, confidence: medium]** The contact phone number "012345678901" is 12 digits. UK landline and mobile numbers (including the leading 0) are 11 digits. This number is not a valid UK phone format. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: text-content.txt line 60
  - Open question/risk: Likely intentional placeholder data for a demo environment, but worth flagging as a factual/World inconsistency. If this reaches production, no customer can call the number.
- **[🔴 high, confidence: high]** The privacy policy body explicitly names a different website ('https://automationintesting.online') and a different data controller ('MW Test Consultancy, 7 Sheridan Close, Norwich, Norfolk, NR8 6RW') as the subject of the policy. This is the Shady Meadows B&B site; the policy has never been customised away from its boilerplate origin. _(source: ai)_
  - Page: http://localhost/privacy
  - Evidence: pages/privacy/screenshot-full.png — first paragraph of Privacy Policy Notice
- **[🟠 medium, confidence: high]** The policy defines 'GDPR means General Data Protection Act.' GDPR stands for General Data Protection Regulation; the Data Protection Act 2018 is the separate UK statute. Conflating them in a legal document is a factual error. _(source: ai)_
  - Page: http://localhost/privacy
  - Evidence: pages/privacy/screenshot-full.png — Policy key definitions bullet list

### History

_No findings recorded under this heuristic._

### Image

- **[🟠 medium, confidence: high]** The browser tab `<title>` is "Restful-booker-platform demo" — the platform's internal name — not "Shady Meadows B&B". Every other visible brand element uses the B&B name. A prospective customer bookmarking or tab-switching would see the platform name, not the business name. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: manifest title field, dom-snapshot.html (<title> element)
  - Open question/risk: Undermines brand presentation; also affects SEO and screen-reader page identification.
- **[🟡 low, confidence: high]** All three room description paragraphs appear to be Lorem Ipsum placeholder content ("Aenean porttitor mauris sit amet lacinia molestie…", "Vestibulum sollicitudin, lectus ac mollis consequat…", "Etiam metus metus, fringilla ac sagittis id…"). No real room description is present for any room type. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: text-content.txt lines 23–24, 32–33, 41
  - Open question/risk: Lorem Ipsum text signals an incomplete page to any visitor who reads the room details. It also means the claimed room features (TV, WiFi, Safe, Radio) are not contextualized by any real description.
- **[🔴 high, confidence: high]** The navbar brand reads 'Restful Booker Platform Demo' and the page <title> reads 'Restful-booker-platform demo' — an entirely different product name. The navigation items are ['Restful Booker Platform Demo', 'Front Page'] versus the golden reference's ['Shady Meadows B&B', 'Rooms', 'Booking', 'Amenities', 'Location', 'Contact', 'Admin']. No Shady Meadows branding, logo, or colour palette is present. _(source: ai)_
  - Page: http://localhost/admin
  - Evidence: pages/admin/screenshot-full.png, pages/admin/dom-snapshot.html — <a class="navbar-brand" href="/">Restful Booker Platform Demo</a>, manifest navDeviationsFromGolden
  - Open question/risk: Is this the wrong application entirely being served at /admin, or has the admin shell template accidentally inherited a different product's layout?
- **[🟡 low, confidence: high]** The primary Login button has border-radius 6px (vs golden 8px) and padding 6px 12px (vs golden 8px 16px). The button is visually slightly smaller and squarer than the canonical button style established on the Home page. _(source: ai)_
  - Page: http://localhost/admin
  - Evidence: manifest visualDeviationsFromGolden — primary-button-radius-drift (6px vs 8px), primary-button-padding-drift (6px 12px vs 8px 16px)
  - Open question/risk: Minor visual inconsistency; not critical, but the admin shell appears to use a stock Bootstrap button without applying the site's custom button token.
- **[🟡 low, confidence: medium]** The page <title> is 'Restful-booker-platform demo' — a generic developer/demo label. A reservation detail page would typically carry a user-meaningful title such as 'Reservation #1 — Shady Meadows B&B' to support browser history, tab identification, and screen-reader page announcements. _(source: ai)_
  - Page: http://localhost/reservation/1?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: dom-snapshot.html: <title>Restful-booker-platform demo</title>
  - Open question/risk: The generic title undermines brand professionalism and makes the tab/history entry uninformative, but is secondary to the page failing to load at all.
- **[🟡 low, confidence: high]** The page `<title>` is 'Restful-booker-platform demo'. The word 'demo' appears in the browser tab, bookmarks, and any search-engine snippet. This is inconsistent with a production-quality booking experience and undermines brand credibility. _(source: ai)_
  - Page: http://localhost/reservation/2?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: dom-snapshot.html: <title>Restful-booker-platform demo</title>
  - Open question/risk: Even if a user bookmarks or shares this URL, the tab title broadcasts that this is a demo system — a brand-image problem (Image heuristic) and a credibility signal that conflicts with professional presentation.
- **[🟡 low, confidence: medium]** The page `<title>` is 'Restful-booker-platform demo' — the application's global default, unchanged for this route. A browser tab, bookmark, or screen-reader page summary conveys nothing about the reservation being viewed. Good practice for a detail page is a title that includes the record identity (e.g. 'Reservation #3 | Shady Meadows'). _(source: ai)_
  - Page: http://localhost/reservation/3?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: dom-snapshot.html: <title>Restful-booker-platform demo</title>, manifest: title = 'Restful-booker-platform demo'
  - Open question/risk: Is the page title intentionally generic for this demo, or is dynamic title-setting per route simply not implemented?
- **[🔴 high, confidence: high]** The cookie policy body text repeatedly names 'Automation in Testing Online' as the data controller (e.g., 'How does Automation in Testing Online use cookies?') rather than Shady Meadows B&B. The legal/policy document references the wrong product and company throughout. _(source: ai)_
  - Page: http://localhost/cookie
  - Evidence: pages/cookie/screenshot-full.png — visible heading 'How does Automation in Testing Online use cookies?'
  - Open question/risk: Users reading the Cookie Policy are given the name of a completely different product as the party responsible for their data. In a real deployment this would be legally misleading and damaging to brand trust.
- **[🟠 medium, confidence: high]** Four footer links (author attribution 'Mark Winteringham', 'Cookie-Policy', 'Privacy-Policy', 'Admin panel') fail WCAG 2 AA minimum contrast: foreground #0d6efd on background #212529 yields a ratio of 3.42:1 against the required 4.5:1 for normal-weight 14px text. _(source: ai)_
  - Page: http://localhost/cookie
  - Evidence: accessibilityViolations[0] — color-contrast, 4 nodes
  - Open question/risk: Links in the footer are harder to read for users with low vision or colour-vision deficiencies; this is a confirmed WCAG 1.4.3 (Level AA) violation.
- **[🟡 low, confidence: high]** The page <title> is 'Restful-booker-platform demo' — the underlying platform's generic name. It does not identify the page as the Cookie Policy or associate it with the Shady Meadows B&B brand. _(source: ai)_
  - Page: http://localhost/cookie
  - Evidence: manifest — title: 'Restful-booker-platform demo', pages/cookie/dom-snapshot.html — <title>
  - Open question/risk: Poor for SEO, screen-reader context, and browser tab identification; a user with multiple tabs open cannot distinguish this tab from any other page on the site.
- **[🟠 medium, confidence: high]** The 'Device and Connection Information' section states data is collected 'to assist us with prioritising our testing.' In a public-facing privacy policy for a B&B, this reveals the underlying test-platform's purpose, is misleading to users, and undermines brand credibility. _(source: ai)_
  - Page: http://localhost/privacy
  - Evidence: pages/privacy/screenshot-full.png — Device And Connection Information section
- **[🟠 medium, confidence: high]** The <title> element site-wide is 'Restful-booker-platform demo'. On a legal page a user may bookmark or share, the title should identify the document (e.g., 'Privacy Policy | Shady Meadows B&B'). The generic platform title breaks user expectations and hides the page identity from screen readers on load. _(source: ai)_
  - Page: http://localhost/privacy
  - Evidence: pages/privacy/dom-snapshot.html — <title>Restful-booker-platform demo</title>

### Comparable Products

- **[🟠 medium, confidence: high]** Primary/submit button border-radius (6px) differs from the golden reference (8px). _(source: deterministic)_
  - Page: http://localhost/admin
- **[🟠 medium, confidence: high]** Primary/submit button padding (6px 12px) differs from the golden reference (8px 16px) by up to 4.0px. _(source: deterministic)_
  - Page: http://localhost/admin
- **[🟡 low, confidence: high]** The header nav includes Rooms, Booking, Amenities, Location, Contact, and Admin. The footer Quick Links include only Home, Rooms, Booking, and Contact — omitting Amenities, Location, and Admin, while adding Home. The two navigation surfaces are inconsistent with each other. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: dom-snapshot.html (navbar vs footer ul), text-content.txt lines 2–7 vs 88–91
  - Open question/risk: Users anchoring their mental model from the footer will miss Location and Admin; users who expect the footer to mirror the nav will be confused by the discrepancy.
- **[🔴 high, confidence: high]** The navbar brand reads 'Restful Booker Platform Demo' and the page <title> reads 'Restful-booker-platform demo' — an entirely different product name. The navigation items are ['Restful Booker Platform Demo', 'Front Page'] versus the golden reference's ['Shady Meadows B&B', 'Rooms', 'Booking', 'Amenities', 'Location', 'Contact', 'Admin']. No Shady Meadows branding, logo, or colour palette is present. _(source: ai)_
  - Page: http://localhost/admin
  - Evidence: pages/admin/screenshot-full.png, pages/admin/dom-snapshot.html — <a class="navbar-brand" href="/">Restful Booker Platform Demo</a>, manifest navDeviationsFromGolden
  - Open question/risk: Is this the wrong application entirely being served at /admin, or has the admin shell template accidentally inherited a different product's layout?
- **[🟡 low, confidence: high]** The primary Login button has border-radius 6px (vs golden 8px) and padding 6px 12px (vs golden 8px 16px). The button is visually slightly smaller and squarer than the canonical button style established on the Home page. _(source: ai)_
  - Page: http://localhost/admin
  - Evidence: manifest visualDeviationsFromGolden — primary-button-radius-drift (6px vs 8px), primary-button-padding-drift (6px 12px vs 8px 16px)
  - Open question/risk: Minor visual inconsistency; not critical, but the admin shell appears to use a stock Bootstrap button without applying the site's custom button token.
- **[🔴 high, confidence: high]** When the data fetch fails there is no error message, no retry button, and no timeout. The spinner runs indefinitely. Users cannot tell whether the page is still loading, their reservation doesn't exist, or the service is down. _(source: ai)_
  - Page: http://localhost/reservation/1?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: screenshot-full.png, dom-snapshot.html
  - Open question/risk: Absence of any error or empty-state UI means the failure mode is completely silent to the user. Industry-standard practice is to surface a meaningful message ('We couldn't load your reservation — please try again or contact support') and a recovery action.

### Claims

- **[🔴 high, confidence: high]** Creating a new record via the UI completed without any visible error, but the new record never actually appears on the list page afterward — the create action silently does not persist. _(source: deterministic)_
  - Page: http://localhost
- **[🔴 high, confidence: high]** All three room cards use alt="Single Room" regardless of room type. The Double and Suite images (room2.jpg, room3.jpg) both carry the same incorrect alt text as the Single room. DOM evidence: `<img alt="Single Room" src="/images/room2.jpg">` and `<img alt="Single Room" src="/images/room3.jpg">`. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: dom-snapshot.html (room card img elements), screenshot-full.png (Our Rooms section)
  - Open question/risk: Screen-reader users are told every room is a "Single Room" — directly contradicts the visible Double and Suite headings. Also a factual content error visible in the DOM.
- **[🔴 high, confidence: high]** The main navigation includes an "Amenities" link (`href="/#amenities"`) but the page contains no element with `id="amenities"` and no "Amenities" heading. The link will silently no-op (scroll to top) rather than navigating to the promised section. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: dom-snapshot.html (navbar nav-item Amenities), text-content.txt (headings: no Amenities heading present)
  - Open question/risk: Users clicking "Amenities" get no feedback that the section is missing — they simply stay at the top of the page. Either the section was removed without updating the nav, or it was never built.
- **[🟠 medium, confidence: high]** The browser tab `<title>` is "Restful-booker-platform demo" — the platform's internal name — not "Shady Meadows B&B". Every other visible brand element uses the B&B name. A prospective customer bookmarking or tab-switching would see the platform name, not the business name. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: manifest title field, dom-snapshot.html (<title> element)
  - Open question/risk: Undermines brand presentation; also affects SEO and screen-reader page identification.
- **[🟠 medium, confidence: high]** The "Getting Here" subsection under Contact Information contains the generic welcome marketing paragraph ("Welcome to Shady Meadows, a delightful Bed & Breakfast nestled in the hills…") verbatim — identical to the hero copy and the footer copy. It contains no directions, landmarks, parking information, or transport links. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: text-content.txt lines 66–68, screenshot-full.png (location section)
  - Open question/risk: The heading "Getting Here" sets a clear user expectation for wayfinding content. Marketing filler instead of directions fails that purpose and could frustrate a customer trying to find the property.
- **[🟡 low, confidence: high]** All three room description paragraphs appear to be Lorem Ipsum placeholder content ("Aenean porttitor mauris sit amet lacinia molestie…", "Vestibulum sollicitudin, lectus ac mollis consequat…", "Etiam metus metus, fringilla ac sagittis id…"). No real room description is present for any room type. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: text-content.txt lines 23–24, 32–33, 41
  - Open question/risk: Lorem Ipsum text signals an incomplete page to any visitor who reads the room details. It also means the claimed room features (TV, WiFi, Safe, Radio) are not contextualized by any real description.
- **[🟡 low, confidence: medium]** The contact phone number "012345678901" is 12 digits. UK landline and mobile numbers (including the leading 0) are 11 digits. This number is not a valid UK phone format. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: text-content.txt line 60
  - Open question/risk: Likely intentional placeholder data for a demo environment, but worth flagging as a factual/World inconsistency. If this reaches production, no customer can call the number.
- **[🟡 low, confidence: high]** The page `<title>` is 'Restful-booker-platform demo'. The word 'demo' appears in the browser tab, bookmarks, and any search-engine snippet. This is inconsistent with a production-quality booking experience and undermines brand credibility. _(source: ai)_
  - Page: http://localhost/reservation/2?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: dom-snapshot.html: <title>Restful-booker-platform demo</title>
  - Open question/risk: Even if a user bookmarks or shares this URL, the tab title broadcasts that this is a demo system — a brand-image problem (Image heuristic) and a credibility signal that conflicts with professional presentation.
- **[🔴 high, confidence: high]** The cookie policy body text repeatedly names 'Automation in Testing Online' as the data controller (e.g., 'How does Automation in Testing Online use cookies?') rather than Shady Meadows B&B. The legal/policy document references the wrong product and company throughout. _(source: ai)_
  - Page: http://localhost/cookie
  - Evidence: pages/cookie/screenshot-full.png — visible heading 'How does Automation in Testing Online use cookies?'
  - Open question/risk: Users reading the Cookie Policy are given the name of a completely different product as the party responsible for their data. In a real deployment this would be legally misleading and damaging to brand trust.
- **[🔴 high, confidence: high]** The privacy policy body explicitly names a different website ('https://automationintesting.online') and a different data controller ('MW Test Consultancy, 7 Sheridan Close, Norwich, Norfolk, NR8 6RW') as the subject of the policy. This is the Shady Meadows B&B site; the policy has never been customised away from its boilerplate origin. _(source: ai)_
  - Page: http://localhost/privacy
  - Evidence: pages/privacy/screenshot-full.png — first paragraph of Privacy Policy Notice
- **[🟠 medium, confidence: high]** The policy defines 'GDPR means General Data Protection Act.' GDPR stands for General Data Protection Regulation; the Data Protection Act 2018 is the separate UK statute. Conflating them in a legal document is a factual error. _(source: ai)_
  - Page: http://localhost/privacy
  - Evidence: pages/privacy/screenshot-full.png — Policy key definitions bullet list
- **[🟠 medium, confidence: high]** The 'Device and Connection Information' section states data is collected 'to assist us with prioritising our testing.' In a public-facing privacy policy for a B&B, this reveals the underlying test-platform's purpose, is misleading to users, and undermines brand credibility. _(source: ai)_
  - Page: http://localhost/privacy
  - Evidence: pages/privacy/screenshot-full.png — Device And Connection Information section

### User Expectations

- **[🟠 medium, confidence: medium]** Form "form-0" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost/admin
- **[🔴 high, confidence: high]** The booking form has `<label for="checkin">Check In</label>` and `<label for="checkout">Check Out</label>`, but the actual date inputs inside the react-datepicker wrapper carry no `id` attribute at all — so the `for` values reference nothing. The axe scanner confirms both inputs as critical label violations. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: accessibilityViolations[1] (label), dom-snapshot.html (booking form)
  - Open question/risk: Screen-reader users cannot determine what data each date field expects. The visual label exists but is programmatically disconnected from the control.
- **[🔴 high, confidence: high]** The main navigation includes an "Amenities" link (`href="/#amenities"`) but the page contains no element with `id="amenities"` and no "Amenities" heading. The link will silently no-op (scroll to top) rather than navigating to the promised section. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: dom-snapshot.html (navbar nav-item Amenities), text-content.txt (headings: no Amenities heading present)
  - Open question/risk: Users clicking "Amenities" get no feedback that the section is missing — they simply stay at the top of the page. Either the section was removed without updating the nav, or it was never built.
- **[🔴 high, confidence: high]** A 'Logout' button is rendered in the navbar on the unauthenticated login page. The user has not yet signed in, so offering a logout action is logically incoherent and will confuse anyone who wonders whether they are already in a session. _(source: ai)_
  - Page: http://localhost/admin
  - Evidence: pages/admin/screenshot-full.png — Logout button visible in top-right nav, pages/admin/dom-snapshot.html — <button class="btn btn-outline-danger my-2 my-sm-0">Logout</button>
  - Open question/risk: Does the Logout button actually do anything from this state, and could it mislead a user into thinking they were previously logged in when they were not?
- **[🟠 medium, confidence: high]** Submitting the login form empty fires a network request to the server (networkRequestFiredOnEmptySubmit: true). There is no client-side validation preventing this, so the server is the only guard. An error indicator is shown afterward, but errorTextOnEmptySubmit is null — meaning the feedback is purely visual with no descriptive message to tell the user what went wrong or what is required. _(source: ai)_
  - Page: http://localhost/admin
  - Evidence: manifest formValidationFindings — networkRequestFiredOnEmptySubmit: true, errorIndicatorShown: true, errorTextOnEmptySubmit: null
  - Open question/risk: A screen-reader user or anyone unable to perceive the visual indicator receives no feedback at all. Additionally, the absence of a description forces the user to guess whether the problem was empty fields, wrong credentials, or a server error.
- **[🔴 high, confidence: high]** The page is stuck in a permanent loading state. The only DOM content is a Bootstrap spinner-border div; no reservation data, headings, or interactive elements ever rendered. The manifest records 1 console error, 1 page error, and 1 bad response, confirming the upstream data fetch failed. The user has no indication of what went wrong and no path to recover. _(source: ai)_
  - Page: http://localhost/reservation/1?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: screenshot-full.png (spinner only, blank page), dom-snapshot.html (spinner-border div, no reservation content), manifest: consoleErrorCount=1, pageErrorCount=1, badResponseCount=1, text-content.txt (empty)
  - Open question/risk: The reservation detail page is completely non-functional: a failed API call produces a permanent spinner instead of any content or error state. Users who arrive here (e.g. from a booking confirmation link) are silently blocked with no recourse.
- **[🔴 high, confidence: high]** When the data fetch fails there is no error message, no retry button, and no timeout. The spinner runs indefinitely. Users cannot tell whether the page is still loading, their reservation doesn't exist, or the service is down. _(source: ai)_
  - Page: http://localhost/reservation/1?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: screenshot-full.png, dom-snapshot.html
  - Open question/risk: Absence of any error or empty-state UI means the failure mode is completely silent to the user. Industry-standard practice is to surface a meaningful message ('We couldn't load your reservation — please try again or contact support') and a recovery action.
- **[🟡 low, confidence: medium]** The page <title> is 'Restful-booker-platform demo' — a generic developer/demo label. A reservation detail page would typically carry a user-meaningful title such as 'Reservation #1 — Shady Meadows B&B' to support browser history, tab identification, and screen-reader page announcements. _(source: ai)_
  - Page: http://localhost/reservation/1?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: dom-snapshot.html: <title>Restful-booker-platform demo</title>
  - Open question/risk: The generic title undermines brand professionalism and makes the tab/history entry uninformative, but is secondary to the page failing to load at all.
- **[🔴 high, confidence: high]** When the data fetch fails, the UI offers no error message, no retry button, and no fallback content whatsoever — only the perpetual spinner. The user cannot distinguish between a temporary network hiccup, a non-existent reservation ID, an authorization problem, or a server outage. _(source: ai)_
  - Page: http://localhost/reservation/2?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: screenshot-full.png (no error UI present), dom-snapshot.html (root-container contains only spinner markup, no error branch rendered)
  - Open question/risk: Silent failure violates Explainability: users cannot determine what went wrong or what to do next. A standard web convention (Familiarity) is to show an error state with a meaningful message and a recovery action (e.g. 'We couldn't load this reservation — go back to My Bookings').
- **[🔴 high, confidence: high]** No error message, fallback state, or recovery path is shown when the data load fails. A user landing here — whether by direct link or back-navigation — has no indication whether the reservation doesn't exist, the server is down, or the URL is wrong. There is no retry control, no 'go back' prompt, and no explanation. _(source: ai)_
  - Page: http://localhost/reservation/3?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: screenshot-full.png (spinner is entire visible UI), dom-snapshot.html (no error branch rendered)
  - Open question/risk: Does the application have any error-boundary or fallback UI for failed reservation fetches, or is an endless spinner the only possible outcome of a bad response?
- **[🟠 medium, confidence: medium]** The cookie policy banner text reads 'BY CONTINUING TO USE OUR SITE AND SERVICES, YOU ARE AGREEING TO THE USE OF COOKIES…' — a passive implied-consent model. There is no cookie consent banner, preference centre, or opt-out mechanism anywhere in the captured evidence. _(source: ai)_
  - Page: http://localhost/cookie
  - Evidence: pages/cookie/screenshot-full.png — uppercase intro paragraph, pages/cookie/dom-snapshot.html — no consent banner or preference UI present
  - Open question/risk: GDPR and the ePrivacy Directive require freely given, specific, informed, and unambiguous consent before setting non-essential cookies — passive consent by continued use does not satisfy that standard. Users also have no way to withdraw or manage consent.
- **[🟡 low, confidence: high]** All three social-media icon buttons link to href='#' — they are visible affordances that do nothing. A user clicking Facebook, Instagram, or Twitter will simply scroll to the top of the page. _(source: ai)_
  - Page: http://localhost/cookie
  - Evidence: pages/cookie/dom-snapshot.html — footer social link hrefs all '#'
  - Open question/risk: Placeholder links that appear functional mislead users; if social media accounts don't exist yet the buttons should be omitted rather than dead-linked.
- **[🟠 medium, confidence: high]** The <title> element site-wide is 'Restful-booker-platform demo'. On a legal page a user may bookmark or share, the title should identify the document (e.g., 'Privacy Policy | Shady Meadows B&B'). The generic platform title breaks user expectations and hides the page identity from screen readers on load. _(source: ai)_
  - Page: http://localhost/privacy
  - Evidence: pages/privacy/dom-snapshot.html — <title>Restful-booker-platform demo</title>
- **[🔴 high, confidence: medium]** The privacy route's DOM and text extraction reflect the full homepage template (hero, booking widget, rooms grid, map, contact form) with privacy policy content appearing only in the screenshot — not in the extracted headings or text. If JavaScript is disabled, users see only the homepage and no privacy policy whatsoever. _(source: ai)_
  - Page: http://localhost/privacy
  - Evidence: pages/privacy/text-content.txt — only homepage content, manifest headings — all homepage headings only, pages/privacy/screenshot-full.png — only privacy content visible

### Purpose

- **[🟠 medium, confidence: high]** 1 network response(s) with a 4xx/5xx status. _(source: deterministic)_
  - Page: http://localhost/reservation/1?checkin=2026-09-05&checkout=2026-09-06
- **[🟠 medium, confidence: high]** 1 network response(s) with a 4xx/5xx status. _(source: deterministic)_
  - Page: http://localhost/reservation/2?checkin=2026-09-05&checkout=2026-09-06
- **[🟠 medium, confidence: high]** 1 network response(s) with a 4xx/5xx status. _(source: deterministic)_
  - Page: http://localhost/reservation/3?checkin=2026-09-05&checkout=2026-09-06
- **[🔴 high, confidence: high]** The main navigation includes an "Amenities" link (`href="/#amenities"`) but the page contains no element with `id="amenities"` and no "Amenities" heading. The link will silently no-op (scroll to top) rather than navigating to the promised section. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: dom-snapshot.html (navbar nav-item Amenities), text-content.txt (headings: no Amenities heading present)
  - Open question/risk: Users clicking "Amenities" get no feedback that the section is missing — they simply stay at the top of the page. Either the section was removed without updating the nav, or it was never built.
- **[🟠 medium, confidence: high]** The "Getting Here" subsection under Contact Information contains the generic welcome marketing paragraph ("Welcome to Shady Meadows, a delightful Bed & Breakfast nestled in the hills…") verbatim — identical to the hero copy and the footer copy. It contains no directions, landmarks, parking information, or transport links. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: text-content.txt lines 66–68, screenshot-full.png (location section)
  - Open question/risk: The heading "Getting Here" sets a clear user expectation for wayfinding content. Marketing filler instead of directions fails that purpose and could frustrate a customer trying to find the property.
- **[🟠 medium, confidence: high]** The three social-media icon buttons (Facebook, Instagram, Twitter) in the footer are `<a href="#">` tags containing only a Bootstrap icon `<i>` element with no visible text, no `aria-label`, no `title`, and no other accessible name. The axe scanner flags all three as serious `link-name` violations. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: accessibilityViolations[2] (link-name, 3 nodes), dom-snapshot.html (footer social links)
  - Open question/risk: Screen-reader users encounter three meaningless unlabelled links. Additionally, all three use `href="#"` so they navigate nowhere — a double failure of purpose and accessibility.
- **[🟠 medium, confidence: high]** The footer "Quick Links" column lists Home, Rooms, Booking, and Contact — all pointing to `href="#"`. Unlike the main nav's anchor hrefs (e.g. `/#rooms`), these links are true dead stubs that scroll to the page top on every click. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: dom-snapshot.html (footer Quick Links ul)
  - Open question/risk: Users who click a footer quick link expect to jump to the relevant section; they instead stay at the top with no feedback. Comparable footers on comparable sites navigate correctly.
- **[🔴 high, confidence: high]** The page is stuck in a permanent loading state. The only DOM content is a Bootstrap spinner-border div; no reservation data, headings, or interactive elements ever rendered. The manifest records 1 console error, 1 page error, and 1 bad response, confirming the upstream data fetch failed. The user has no indication of what went wrong and no path to recover. _(source: ai)_
  - Page: http://localhost/reservation/1?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: screenshot-full.png (spinner only, blank page), dom-snapshot.html (spinner-border div, no reservation content), manifest: consoleErrorCount=1, pageErrorCount=1, badResponseCount=1, text-content.txt (empty)
  - Open question/risk: The reservation detail page is completely non-functional: a failed API call produces a permanent spinner instead of any content or error state. Users who arrive here (e.g. from a booking confirmation link) are silently blocked with no recourse.
- **[🔴 high, confidence: high]** The page is completely non-functional: the React component never exits its loading state. The screenshot shows only a Bootstrap spinner; the text-content file is empty; headings and footer are absent. The manifest records one console error, one page error, and one bad API response — all consistent with a failed data fetch for reservation ID 2 that left the component hanging indefinitely. _(source: ai)_
  - Page: http://localhost/reservation/2?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: screenshot-full.png (spinner only), text-content.txt (empty), manifest: consoleErrorCount=1, pageErrorCount=1, badResponseCount=1, headings=[]
  - Open question/risk: Any user navigating to this reservation URL sees an infinite spinner with no content, no error message, and no path to recovery — the page's primary purpose (displaying reservation details) is completely blocked.
- **[🔴 high, confidence: high]** Page never renders its content: the screenshot shows only a Bootstrap spinner, extracted text is empty, and the manifest records 1 bad API response, 1 console error, and 1 page error. The reservation detail for ID=3 could not be fetched, but the application silently spins rather than surfacing an error state. _(source: ai)_
  - Page: http://localhost/reservation/3?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: screenshot-full.png (spinner only, blank body), manifest: consoleErrorCount=1, pageErrorCount=1, badResponseCount=1, text-content.txt (empty)
  - Open question/risk: The CRUD-Read operation for reservation 3 fails and the application has no visible error recovery path — users are left with an indefinite spinner and no explanation of what went wrong or what to do next.
- **[🟡 low, confidence: high]** The URL pattern `/reservation/3?checkin=2026-09-05&checkout=2026-09-06` with check-in/check-out parameters belongs to a hotel-booking system (Restful Booker / Shady Meadows), not a widget inventory catalog. This page type has no counterpart in the WidgetWorks charter scope (Home, Catalog, Item detail, New item, Edit item, Account, Contact, About). The manifest confirms it was reached via direct navigation, not an in-app link — suggesting it was injected into the session rather than discovered organically. _(source: ai)_
  - Page: http://localhost/reservation/3?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: manifest: reachedVia='direct-nav', manifest: otherUrlsSharingThisTemplate=[], dom-snapshot.html: title and meta description reference Restful-booker-platform
  - Open question/risk: Is this run (shadymeadows-full-1) actually targeting the Restful Booker application rather than WidgetWorks? If so, the charter and product description provided to the session are mismatched and findings should be re-evaluated against the correct product oracle.
- **[🟡 low, confidence: high]** All three social-media icon buttons link to href='#' — they are visible affordances that do nothing. A user clicking Facebook, Instagram, or Twitter will simply scroll to the top of the page. _(source: ai)_
  - Page: http://localhost/cookie
  - Evidence: pages/cookie/dom-snapshot.html — footer social link hrefs all '#'
  - Open question/risk: Placeholder links that appear functional mislead users; if social media accounts don't exist yet the buttons should be omitted rather than dead-linked.
- **[🔴 high, confidence: medium]** The privacy route's DOM and text extraction reflect the full homepage template (hero, booking widget, rooms grid, map, contact form) with privacy policy content appearing only in the screenshot — not in the extracted headings or text. If JavaScript is disabled, users see only the homepage and no privacy policy whatsoever. _(source: ai)_
  - Page: http://localhost/privacy
  - Evidence: pages/privacy/text-content.txt — only homepage content, manifest headings — all homepage headings only, pages/privacy/screenshot-full.png — only privacy content visible

### Statutes/Standards

- **[🔴 high, confidence: high]** Accessibility: Elements must meet minimum color contrast ratio thresholds (color-contrast, impact: serious) _(source: deterministic)_
  - Page: http://localhost
- **[🔴 high, confidence: high]** Accessibility: Form elements must have labels (label, impact: critical) _(source: deterministic)_
  - Page: http://localhost
- **[🔴 high, confidence: high]** Accessibility: Links must have discernible text (link-name, impact: serious) _(source: deterministic)_
  - Page: http://localhost
- **[🔴 high, confidence: high]** Accessibility: Elements must meet minimum color contrast ratio thresholds (color-contrast, impact: serious) _(source: deterministic)_
  - Page: http://localhost/admin
- **[🟠 medium, confidence: medium]** Form "form-0" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost/admin
- **[🔴 high, confidence: high]** Accessibility: Elements must meet minimum color contrast ratio thresholds (color-contrast, impact: serious) _(source: deterministic)_
  - Page: http://localhost/cookie
- **[🔴 high, confidence: high]** Accessibility: Links must have discernible text (link-name, impact: serious) _(source: deterministic)_
  - Page: http://localhost/cookie
- **[🔴 high, confidence: high]** Accessibility: Elements must meet minimum color contrast ratio thresholds (color-contrast, impact: serious) _(source: deterministic)_
  - Page: http://localhost/privacy
- **[🔴 high, confidence: high]** Accessibility: Links must have discernible text (link-name, impact: serious) _(source: deterministic)_
  - Page: http://localhost/privacy
- **[🔴 high, confidence: high]** All three room cards use alt="Single Room" regardless of room type. The Double and Suite images (room2.jpg, room3.jpg) both carry the same incorrect alt text as the Single room. DOM evidence: `<img alt="Single Room" src="/images/room2.jpg">` and `<img alt="Single Room" src="/images/room3.jpg">`. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: dom-snapshot.html (room card img elements), screenshot-full.png (Our Rooms section)
  - Open question/risk: Screen-reader users are told every room is a "Single Room" — directly contradicts the visible Double and Suite headings. Also a factual content error visible in the DOM.
- **[🔴 high, confidence: high]** The booking form has `<label for="checkin">Check In</label>` and `<label for="checkout">Check Out</label>`, but the actual date inputs inside the react-datepicker wrapper carry no `id` attribute at all — so the `for` values reference nothing. The axe scanner confirms both inputs as critical label violations. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: accessibilityViolations[1] (label), dom-snapshot.html (booking form)
  - Open question/risk: Screen-reader users cannot determine what data each date field expects. The visual label exists but is programmatically disconnected from the control.
- **[🔴 high, confidence: high]** The contact form has `<label for="message">Message</label>` but the textarea has `id="description"`. The `for`/`id` values do not match, so the label is not programmatically associated with the field. Confirmed by the axe `label` violation on `#description`. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: accessibilityViolations[1] (label, #description node), dom-snapshot.html (contact form)
  - Open question/risk: Keyboard and screen-reader users cannot reliably identify the Message field. A fix that changes `for="message"` to `for="description"` (or vice-versa) would resolve this.
- **[🟠 medium, confidence: high]** Four footer links fail WCAG 2.0 AA colour contrast: "Mark Winteringham", "Cookie-Policy", "Privacy-Policy", and "Admin panel" all render as #0d6efd (Bootstrap link blue) on #212529 (dark footer background) — contrast ratio 3.42:1 against the required 4.5:1. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: accessibilityViolations[0] (color-contrast, 4 nodes)
  - Open question/risk: Affects users with low vision. The Cookie-Policy and Privacy-Policy links may carry legal significance; their inaccessibility could compound a compliance concern.
- **[🟠 medium, confidence: high]** The three social-media icon buttons (Facebook, Instagram, Twitter) in the footer are `<a href="#">` tags containing only a Bootstrap icon `<i>` element with no visible text, no `aria-label`, no `title`, and no other accessible name. The axe scanner flags all three as serious `link-name` violations. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: accessibilityViolations[2] (link-name, 3 nodes), dom-snapshot.html (footer social links)
  - Open question/risk: Screen-reader users encounter three meaningless unlabelled links. Additionally, all three use `href="#"` so they navigate nowhere — a double failure of purpose and accessibility.
- **[🔴 high, confidence: high]** The Logout button fails WCAG 2 AA minimum contrast: foreground #dc3545 on background #212529 produces a contrast ratio of 3.4:1, against the required 4.5:1 for normal-weight 16px text. _(source: ai)_
  - Page: http://localhost/admin
  - Evidence: manifest accessibilityViolations — id: color-contrast, impact: serious, node: .btn-outline-danger
  - Open question/risk: Users with low vision or colour deficiency cannot reliably read the Logout label, and the site is non-compliant with WCAG 2.1 SC 1.4.3.
- **[🟠 medium, confidence: high]** Submitting the login form empty fires a network request to the server (networkRequestFiredOnEmptySubmit: true). There is no client-side validation preventing this, so the server is the only guard. An error indicator is shown afterward, but errorTextOnEmptySubmit is null — meaning the feedback is purely visual with no descriptive message to tell the user what went wrong or what is required. _(source: ai)_
  - Page: http://localhost/admin
  - Evidence: manifest formValidationFindings — networkRequestFiredOnEmptySubmit: true, errorIndicatorShown: true, errorTextOnEmptySubmit: null
  - Open question/risk: A screen-reader user or anyone unable to perceive the visual indicator receives no feedback at all. Additionally, the absence of a description forces the user to guess whether the problem was empty fields, wrong credentials, or a server error.
- **[🟠 medium, confidence: high]** The Bootstrap spinner uses `<span class="visually-hidden"></span>` with no inner text. The Bootstrap documentation requires this span to contain a text label (e.g. 'Loading...') so screen readers can announce the loading state. An empty span provides no accessible name. _(source: ai)_
  - Page: http://localhost/reservation/1?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: dom-snapshot.html: <span class="visually-hidden"></span>
  - Open question/risk: Screen-reader users receive no indication that the page is loading, making the application inaccessible during (and, if the spinner never clears, permanently) this state.
- **[🟠 medium, confidence: high]** The Bootstrap spinner markup is `<div class="spinner-border" role="status"><span class="visually-hidden"></span></div>`. The visually-hidden span is empty. Bootstrap's own documented pattern requires `<span class="visually-hidden">Loading...</span>` so that screen readers announce the loading state. An empty span paired with `role="status"` results in a live region that announces nothing. _(source: ai)_
  - Page: http://localhost/reservation/2?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: dom-snapshot.html: <span class="visually-hidden"></span> (empty)
  - Open question/risk: Screen reader users receive no indication that the page is loading — a WCAG 4.1.3 (Status Messages) concern. The automated scanner returned zero violations, likely because it checked a technically valid role attribute rather than the missing text node inside it.
- **[🟠 medium, confidence: high]** The Bootstrap spinner uses `role="status"` (correct) but its inner `<span class="visually-hidden"></span>` is empty. Bootstrap's own documentation requires text such as 'Loading…' inside this span to give screen-reader users an announcement. Without it, a screen reader user lands on a blank page with no feedback that anything is happening. _(source: ai)_
  - Page: http://localhost/reservation/3?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: dom-snapshot.html: <div class="spinner-border" role="status"><span class="visually-hidden"></span></div>
  - Open question/risk: All loading spinners in the application should be audited for the same omission — this is likely a copy-paste pattern applied everywhere.
- **[🟠 medium, confidence: medium]** The cookie policy banner text reads 'BY CONTINUING TO USE OUR SITE AND SERVICES, YOU ARE AGREEING TO THE USE OF COOKIES…' — a passive implied-consent model. There is no cookie consent banner, preference centre, or opt-out mechanism anywhere in the captured evidence. _(source: ai)_
  - Page: http://localhost/cookie
  - Evidence: pages/cookie/screenshot-full.png — uppercase intro paragraph, pages/cookie/dom-snapshot.html — no consent banner or preference UI present
  - Open question/risk: GDPR and the ePrivacy Directive require freely given, specific, informed, and unambiguous consent before setting non-essential cookies — passive consent by continued use does not satisfy that standard. Users also have no way to withdraw or manage consent.
- **[🟠 medium, confidence: high]** Four footer links (author attribution 'Mark Winteringham', 'Cookie-Policy', 'Privacy-Policy', 'Admin panel') fail WCAG 2 AA minimum contrast: foreground #0d6efd on background #212529 yields a ratio of 3.42:1 against the required 4.5:1 for normal-weight 14px text. _(source: ai)_
  - Page: http://localhost/cookie
  - Evidence: accessibilityViolations[0] — color-contrast, 4 nodes
  - Open question/risk: Links in the footer are harder to read for users with low vision or colour-vision deficiencies; this is a confirmed WCAG 1.4.3 (Level AA) violation.
- **[🟠 medium, confidence: high]** The three footer social-media icon buttons (Facebook, Instagram, Twitter) are keyboard-focusable but have no accessible name — no visible text, no aria-label, no title attribute. Screen-reader users cannot determine their purpose. _(source: ai)_
  - Page: http://localhost/cookie
  - Evidence: accessibilityViolations[1] — link-name, 3 nodes (.btn-outline-light:nth-child(1/2/3))
  - Open question/risk: Violates WCAG 2.4.4 Link Purpose (Level A) and 4.1.2 Name, Role, Value (Level A). A screen-reader user will encounter three anonymous focusable elements with no indication of where they lead.
- **[🟠 medium, confidence: medium]** The heading scanner extracted only homepage headings with no 'Privacy Policy Notice' heading present, even though the screenshot shows that heading prominently. The privacy content appears injected by client-side JavaScript after initial render, meaning the heading is absent from the static document outline and may not be announced correctly to screen readers on page load. _(source: ai)_
  - Page: http://localhost/privacy
  - Evidence: manifest headings array — no privacy heading present, pages/privacy/screenshot-full.png — 'Privacy Policy Notice' visible at top
- **[🟠 medium, confidence: high]** Four footer links (Mark Winteringham, Cookie-Policy, Privacy-Policy, Admin panel) have a measured contrast ratio of 3.42:1 (#0d6efd on #212529, 14 px normal weight), below the WCAG AA minimum of 4.5:1. Confirmed automated violation (color-contrast, wcag143). _(source: ai)_
  - Page: http://localhost/privacy
  - Evidence: accessibilityViolations[0] — color-contrast nodes in footer <small>
- **[🟠 medium, confidence: high]** The footer's Facebook, Instagram, and Twitter icon links have no accessible text — no visible label, aria-label, or title attribute. Screen readers cannot determine the destination or purpose of these links. Confirmed WCAG 2.4.4 and 4.1.2 violation (link-name). _(source: ai)_
  - Page: http://localhost/privacy
  - Evidence: accessibilityViolations[1] — link-name nodes targeting .btn-outline-light social icon anchors

## CRUD Findings

### Create

- **[🟠 medium, confidence: medium]** Form "form-0" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost/admin
- **[🔴 high, confidence: high]** Creating a new record via the UI completed without any visible error, but the new record never actually appears on the list page afterward — the create action silently does not persist. _(source: deterministic)_
  - Page: http://localhost

### Read

- **[🔴 high, confidence: high]** All three room cards use alt="Single Room" regardless of room type. The Double and Suite images (room2.jpg, room3.jpg) both carry the same incorrect alt text as the Single room. DOM evidence: `<img alt="Single Room" src="/images/room2.jpg">` and `<img alt="Single Room" src="/images/room3.jpg">`. _(source: ai)_
  - Page: http://localhost (index.html — Shady Meadows B&B home)
  - Evidence: dom-snapshot.html (room card img elements), screenshot-full.png (Our Rooms section)
  - Open question/risk: Screen-reader users are told every room is a "Single Room" — directly contradicts the visible Double and Suite headings. Also a factual content error visible in the DOM.
- **[🔴 high, confidence: high]** The page is stuck in a permanent loading state. The only DOM content is a Bootstrap spinner-border div; no reservation data, headings, or interactive elements ever rendered. The manifest records 1 console error, 1 page error, and 1 bad response, confirming the upstream data fetch failed. The user has no indication of what went wrong and no path to recover. _(source: ai)_
  - Page: http://localhost/reservation/1?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: screenshot-full.png (spinner only, blank page), dom-snapshot.html (spinner-border div, no reservation content), manifest: consoleErrorCount=1, pageErrorCount=1, badResponseCount=1, text-content.txt (empty)
  - Open question/risk: The reservation detail page is completely non-functional: a failed API call produces a permanent spinner instead of any content or error state. Users who arrive here (e.g. from a booking confirmation link) are silently blocked with no recourse.
- **[🔴 high, confidence: high]** The page is completely non-functional: the React component never exits its loading state. The screenshot shows only a Bootstrap spinner; the text-content file is empty; headings and footer are absent. The manifest records one console error, one page error, and one bad API response — all consistent with a failed data fetch for reservation ID 2 that left the component hanging indefinitely. _(source: ai)_
  - Page: http://localhost/reservation/2?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: screenshot-full.png (spinner only), text-content.txt (empty), manifest: consoleErrorCount=1, pageErrorCount=1, badResponseCount=1, headings=[]
  - Open question/risk: Any user navigating to this reservation URL sees an infinite spinner with no content, no error message, and no path to recovery — the page's primary purpose (displaying reservation details) is completely blocked.
- **[🔴 high, confidence: high]** Page never renders its content: the screenshot shows only a Bootstrap spinner, extracted text is empty, and the manifest records 1 bad API response, 1 console error, and 1 page error. The reservation detail for ID=3 could not be fetched, but the application silently spins rather than surfacing an error state. _(source: ai)_
  - Page: http://localhost/reservation/3?checkin=2026-09-05&checkout=2026-09-06
  - Evidence: screenshot-full.png (spinner only, blank body), manifest: consoleErrorCount=1, pageErrorCount=1, badResponseCount=1, text-content.txt (empty)
  - Open question/risk: The CRUD-Read operation for reservation 3 fails and the application has no visible error recovery path — users are left with an indefinite spinner and no explanation of what went wrong or what to do next.

### Update

_No findings recorded under this heuristic._

### Delete

_No findings recorded under this heuristic._

### CRUD smoke flow detail

### create
- formUrl: http://localhost
- tagValue: AAA-PROBE-1788613973887
- navigatedTo: http://localhost/

### read-after-create
- listUrl: http://localhost
- foundOnListPage: false

### update-0
- Skipped: no edit link found from this item's detail page

### update-1
- Skipped: no edit link found from this item's detail page

### update-2
- Skipped: no edit link found from this item's detail page

### read-beyond-page-1
- attempted: false
- reached: false
- reason: no Next-like control found

### delete
- Skipped: could not find a second item to test deletion on


## Deterministic Scan Summary

- Pages scanned: 7
- Broken links: 0
- Broken assets: 0
- Console errors (total): 3
- Accessibility violations (total): 8
- Visual deviations from golden reference (total): 2
- CRUD smoke flow ran: true

## Open Questions

- http://localhost (index.html — Shady Meadows B&B home): Does the 'Amenities' section exist on a separate page, or was it planned but never built — and if the latter, has the nav item been intentionally left as a stub?
- http://localhost (index.html — Shady Meadows B&B home): The 'Check Availability' and 'Submit' buttons are both type="button" (not type="submit") — is there JS wired to handle submission, and if so does it actually fire a network request? The form validation probe showed an error indicator appears on empty submit, which suggests JS is present, but the probe did not capture what API call (if any) backs it.
- http://localhost (index.html — Shady Meadows B&B home): The social-media footer links all use href="#" — are real social profiles planned, or are these permanent placeholders?
- http://localhost (index.html — Shady Meadows B&B home): The contact textarea has id="description" but the label says for="message" — which side is the typo (should the `id` be `message`, or the `for` be `description`)?
- http://localhost/admin: Is the 'Restful Booker Platform Demo' branding intentional (i.e. this is a known third-party admin shell) or is it a deployment misconfiguration where the wrong application is serving at /admin?
- http://localhost/admin: Does the Logout button perform any action when clicked from the unauthenticated state, or is it a no-op / navigation dead-end?
- http://localhost/admin: What does the error state actually look like after an empty or wrong-credential submission — is there any text at all, or only a red border on the fields?
- http://localhost/admin: After a successful login, does the admin area switch to Shady Meadows branding and navigation, or does it remain in the 'Restful Booker Platform Demo' shell throughout?
- http://localhost/reservation/1?checkin=2026-09-05&checkout=2026-09-06: What API endpoint does the reservation page call, and what error does it return for reservation ID 1 with these dates? (The bad response could be a 404, 500, or CORS failure — each has a different fix.)
- http://localhost/reservation/1?checkin=2026-09-05&checkout=2026-09-06: Is the spinner timeout intentionally unbounded, or is there a race condition / missing error-boundary in the Next.js client component?
- http://localhost/reservation/1?checkin=2026-09-05&checkout=2026-09-06: Does the same blank-spinner failure occur for other reservation IDs or date combinations, or is this specific to ID 1 / these dates?
- http://localhost/reservation/1?checkin=2026-09-05&checkout=2026-09-06: Is there an error boundary or not-found route configured in Next.js that should have caught this — and if so, why did it not trigger?
- http://localhost/reservation/2?checkin=2026-09-05&checkout=2026-09-06: Does reservation ID 2 exist in the database? The bad response could be a legitimate 404 (record not found), a server error, or a CORS/auth problem — the specific HTTP status and response body from the failed request would clarify root cause.
- http://localhost/reservation/2?checkin=2026-09-05&checkout=2026-09-06: Is this failure reproducible for all reservation IDs, or specific to ID 2? Testing /reservation/1 and /reservation/3 would reveal whether the route itself is broken or only this record.
- http://localhost/reservation/2?checkin=2026-09-05&checkout=2026-09-06: Does the application have any error boundary defined at the reservation route level? The DOM shows no rendered error UI, suggesting either there is no error boundary or the error occurred before hydration could trigger one.
- http://localhost/reservation/2?checkin=2026-09-05&checkout=2026-09-06: Were the checkin/checkout query parameters expected to drive the data fetch, or are they purely informational? If the API call uses them to filter and they produce an impossible or conflicting range, that could explain the bad response.
- http://localhost/reservation/2?checkin=2026-09-05&checkout=2026-09-06: The page title references 'Restful-booker-platform demo' while the charter describes 'WidgetWorks' — is this page from a different application than the one chartered, and if so, should it be in scope for this session?
- http://localhost/reservation/3?checkin=2026-09-05&checkout=2026-09-06: What API endpoint returned the bad response — does reservation ID 3 not exist in the seed data, or is the backend service unavailable?
- http://localhost/reservation/3?checkin=2026-09-05&checkout=2026-09-06: Is the run 'shadymeadows-full-1' targeting the Restful Booker / Shady Meadows application rather than WidgetWorks? The URL pattern, page title, and run name all point to a hotel booking system, not a widget catalog.
- http://localhost/reservation/3?checkin=2026-09-05&checkout=2026-09-06: Does the application have any error-boundary or fallback UI for failed reservation API calls, or is an endless spinner the only outcome?
- http://localhost/reservation/3?checkin=2026-09-05&checkout=2026-09-06: Are all loading spinners across the application missing the required accessible label text inside their visually-hidden span, or is this isolated to this route?
- http://localhost/reservation/3?checkin=2026-09-05&checkout=2026-09-06: Can `/reservation/3` be reached from any in-app link, or is it only accessible by direct URL? If no in-app path reaches it, the page may be a dead route.
- http://localhost/cookie: Which cookies does Shady Meadows B&B actually set — are they all essential/session, or are analytics/third-party cookies present that would trigger GDPR consent requirements?
- http://localhost/cookie: Is 'Automation in Testing Online' placeholder text intentionally left from the test platform, or does a corrected, Shady Meadows-branded policy exist but fail to load?
- http://localhost/cookie: Do the social media icon links on other pages (home, about, contact) also dead-link to '#', or is this isolated to the footer of the cookie page?
- http://localhost/cookie: The footer copyright reads '© 2019-26' — is this intentional shorthand for 2019–2026, or a typo for '© 2026'?
- http://localhost/privacy: Does the privacy policy content render inside a client-side modal/overlay? If so, is there a close/dismiss mechanism and does keyboard focus management work correctly for screen reader users?
- http://localhost/privacy: Is the phone number 012345678901 (12 digits) a typo? UK numbers are 11 digits.
- http://localhost/privacy: The policy claims the site is exempt from ICO registration — is that accurate given the site collects contact-form submissions, booking data, and device telemetry?
- http://localhost/privacy: The social media icon links all point to '#' (no real destination). Are these intentional placeholders, and why are they present on a live-facing page without at minimum an aria-label?

## Session Metadata

- Run ID: shadymeadows-full-1
- Evidence directory: C:\Users\PaulYardley\Projects\ExporitoryTesting\exploratory-tester\runs\shadymeadows-full-1
- AI findings: C:\Users\PaulYardley\Projects\ExporitoryTesting\exploratory-tester\runs\shadymeadows-full-1\ai-findings
