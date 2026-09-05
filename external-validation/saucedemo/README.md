# External validation: Sauce Demo

Not part of the WidgetWorks/answer-key ecosystem — this is a genuinely independent site (`saucedemo.com`, built by Sauce Labs, no relation to this project) used to test whether `exploratory-tester/` actually generalizes beyond the app it was co-designed with. See `FINDINGS.md` §9 in the repo root for the full writeup: three real generalization gaps found and fixed (login, client-side routing, `href="#"` navigation), and what the tool found once they were fixed — including one of the most well-known `problem_user` bugs in the QA community, caught with zero prior knowledge of this app.

## Files

- `login.mjs` — regenerates `storage-state.json` by actually logging in (`node login.mjs [username]`, default `problem_user`). Not actually used by the final working approach (see below) — kept as a reference for the `--storage-state` flag path, which works for sites that check the session cookie on load.
- `storage-state.json` — output of the above. Gitignored (regenerable, and a session artifact rather than something worth version-controlling even though Sauce Demo's cookie carries no real secret).

## How the tool is actually pointed at this site

Sauce Demo doesn't check the session cookie on page load (see FINDINGS.md §9), so `storage-state.json` alone isn't sufficient — the working invocation uses the tool's `--login-url`/`--login-username`/`--login-password` flags to perform a real login instead:

```bash
cd ../../exploratory-tester
node bin/cli.js \
  --url https://www.saucedemo.com \
  --checklist ../checklist/few-hiccupss-crud-checklist.md \
  --charter ../charter/exploratory-charter.md \
  --app-desc ../app-spec/test-app-description.md \
  --golden-path /inventory.html \
  --login-url https://www.saucedemo.com/ \
  --login-username problem_user \
  --login-password secret_sauce \
  --run-id saucedemo-my-run
```

Available usernames (shared password `secret_sauce`, all public on Sauce Demo's own login page): `standard_user`, `problem_user`, `visual_user`, `error_user`, `performance_glitch_user`, `locked_out_user`.
