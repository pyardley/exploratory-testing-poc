# External validation: Shady Meadows B&B

Not part of the WidgetWorks/answer-key ecosystem — this is a second, genuinely independent site used to test whether `exploratory-tester/` generalizes beyond WidgetWorks and beyond Sauce Demo (`external-validation/saucedemo/`). The target is **Shady Meadows B&B**, the demo front end of Mark Winteringham's [`restful-booker-platform`](https://github.com/mwinteringham/restful-booker-platform) — a real, actively-maintained, seven-microservice hotel-booking training app. Unlike Sauce Demo, it's self-hosted locally via Docker rather than a public hosted site. See `FINDINGS.md` §10 in the repo root for the full writeup: what running it required, and what the tool found — including a booking-path failure traced to a confirmed root cause in the target's own source, and two legal pages that contradict each other about who operates the site.

## Standing up the site locally

```bash
# 1. Clone it somewhere outside this repo (it's not part of this project's git history)
git clone https://github.com/mwinteringham/restful-booker-platform.git
cd restful-booker-platform

# 2. Build the 6 Java services' JARs inside a disposable Maven container
#    (avoids needing Maven/JDK 26 installed on the host — the repo's own pom.xml
#    pins <release>26</release>). The 7th module, `assets` (the Next.js front end),
#    fails this step (it needs npm, not mvn) — that's expected and harmless, since
#    assets/Dockerfile is a fully self-contained Node multi-stage build that never
#    depends on this step.
MSYS_NO_PATHCONV=1 docker run --rm \
  -v "$(pwd):/workspace" -v rbp-maven-repo:/root/.m2 -w /workspace \
  maven:3.9-eclipse-temurin-26 mvn -B package -DskipTests

# 3. Build and start all 7 containers
docker compose up -d --build
# → http://localhost/  (rbp-assets, the Next.js front end, mapped to host port 80)
```

**Windows/Git Bash note:** the `MSYS_NO_PATHCONV=1` prefix on step 2 is required for the same reason it's required for `exploratory-tester`'s own `--golden-path /...` invocations (see the root README) — Git Bash otherwise silently rewrites the leading-slash `-w /workspace` argument into a bogus local filesystem path before Docker ever sees it.

## How the tool is actually pointed at this site

No login is needed — the public booking site (rooms, booking widget, amenities, contact, legal pages) is all reachable without authentication, and every route resolves via ordinary direct navigation (no SPA click-path reconstruction needed here, unlike Sauce Demo):

```bash
cd ../../exploratory-tester
node bin/cli.js \
  --url http://localhost \
  --checklist ../checklist/few-hiccupss-crud-checklist.md \
  --charter ../charter/exploratory-charter.md \
  --app-desc ../app-spec/test-app-description.md \
  --golden-path / \
  --run-id shadymeadows-my-run
```

This run deliberately stayed on the public site and did not attempt the `/admin` login (`admin`/`password`, per the app's own documentation) — the admin area behind it is unexplored territory for a future session.
