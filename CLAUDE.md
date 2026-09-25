# HaalandTracker

Static bilingual site (EN at `/`, NO at `/no/`) tracking Erling Haaland's match
record for Manchester City, the Champions League and Norway. Live at
haalandtracker.com / haalandtracker.no. Work directly on `main` — this repo
pushes straight to main, no PRs, per the owner's preference.

## Verifying a match result — do this before writing anything

A real incident (25 Sep 2026): a match card was published showing Norway 2-1
Denmark with 1 Haaland goal, citing a single source (VAVEL). The actual final
score was Norway 3-2 Denmark with a Haaland brace — the cited source had
almost certainly been captured mid-match (a live-blog snapshot), not at full
time. The owner had to report this as a live, public-facing error.

To prevent this:
- Never write a score/goal count from a single source. Cross-check against at
  least two independent outlets (e.g. two of: ESPN, Sky Sports, Sofascore,
  beIN Sports, official club/federation sites, BBC).
- Prefer sources and phrasing that clearly describe a **finished** match
  ("full-time", "FT", a match report published after the final whistle) over
  a live-score page or a headline that could be a snapshot taken during play.
  A live-blog URL in particular ("live score", "live commentary") is a signal
  to re-search for the post-match report instead of trusting its cited number
  directly.
- If you find dedicated "his Nth international/career goal" milestone
  articles, treat them as a strong cross-check on cumulative totals, not just
  color for that one match — they're usually precisely fact-checked and catch
  a wrong goal count that a plain scoreline search would miss.
- Before publishing a new running total (caps/goals), sanity-check it against
  the site's OWN match-card history: count icon-chip goal icons (NOT
  `icon-boot` assist icons — the card markup uses `class="icon-chip"` for a
  goal and `class="icon-chip icon-boot"` for an assist, and both live inside
  `.match-icons`) across all played (non-`is-missed`, non-`is-planned`)
  `comp-nor` cards, and see that it lands on the number you're about to
  write. A mismatch usually means either the new match's goal count is wrong,
  or — as happened here twice (a Norway-Finland friendly on 4 Sep 2025 and a
  Norway-Switzerland friendly on 31 Mar 2026 were both completely missing) —
  an earlier friendly was never added at all. Friendlies are easy to miss
  because they don't show up in "World Cup qualifying" / "Nations League"
  style searches; search explicitly for Norway's fixture list for the window
  in question, not just the headline competitive matches.

## Build

Source of truth is `source/Main.en.dc.html` and `source/Main.no.dc.html`
(Claude Design canvas files: markup + an embedded `<script>` with the JS
state/render logic). They compile to `assets/site.en.js` / `assets/site.no.js`:

```
node build/transform.mjs source/Main.en.dc.html assets/site.en.js
node build/transform.mjs source/Main.no.dc.html assets/site.no.js
```

Run this after every edit to a `.dc.html` file — the compiled JS is what
actually ships.

**`assets/style.css` is the only real stylesheet.** The `<style>` block
embedded in the `.dc.html` files is preview-only for the canvas editor and
never reaches production. A CSS fix always goes in `assets/style.css`.

Every match-card needs a `comp-<key>` class (`pl`, `cl`, `cup`, `efl`,
`bundesliga`, `friendly`, `shield`, `cwc`, `nor`) — the competition filter
toggles hide/show cards by this class, and a missing one leaks the match
into unrelated filter views.

Before pushing, verify visually: serve the repo root
(`python3 -m http.server`) and screenshot the changed area with Playwright
(Chromium at `/opt/pw-browsers/chromium`) on both `/index.html` and
`/no/index.html`, desktop width 1280, checking for text overflow onto the
colored side ribbon.

## Existing automation — check before adding more

A recurring Routine ("Weekly HaalandTracker stats update", Mondays) plus a
fixture-aware one-shot follow-up ("Haaland match result check", retries
every 30 min up to 12 times) already handle finding new results, adding
match cards, and pushing to `main`. Don't create a second, competing
scheduled check for the same thing — extend or read this file instead.

**Timing override (21 Sep 2026):** the first "Haaland match result check"
attempt after a kickoff should fire at kickoff + 120 minutes (2 hours),
not the kickoff + 140 minutes described in that Routine's own stored
prompt — the owner asked for the earlier check. This file's instruction
takes precedence over that stored wording; this session could not edit
the Routine's prompt directly (only the conversation that owns it can),
so use 120 minutes when you (re)create or update that one-shot follow-up
from step 7 of the weekly Routine, and update the Routine's own prompt to
match if you're ever in a position to (e.g. asked to from its own
conversation).

## Stats cascade — updating hardcoded derived stats after a match

Match cards are added/edited directly, but several other numbers on the
site are hardcoded and do NOT update automatically from the match-card
data. After adding or correcting a played match, update every one of these
that the match's competition affects. Search for the current numbers each
time (don't trust line numbers — the file grows); make every change in
BOTH `source/Main.en.dc.html` and `source/Main.no.dc.html`, mirroring the
exact existing wording/format at each spot.

**Always: the "Last updated" footer badge.** In the footer (search
`foot-updated-row`), a `.topbar-meta`-styled badge reads e.g.
"Last updated: 17 Sep 2026" (EN) / "Sist oppdatert: 17. sep. 2026" (NO).
Whenever you add or correct a played match card (any competition), set
this to that match's own date, in the same "D Mon YYYY" / "D. mnd. YYYY"
format used on match cards — not today's real-world date, the date of
the most recently confirmed match. It moved out of the header into the
footer on 20 Sep 2026 at the owner's request (it was a stale hardcoded
"Aug 2026" that nothing kept in sync); don't move it back.

Progress-percentage formula for any "still achievable" records-chase
entry: `progress = Math.round(currentGoals / targetGoals * 100)`, where
`targetGoals` is the milestone number named in that entry's own title/desc
(e.g. 101 for "Overtake Robert Lewandowski (101 CL goals)", 140 for the
Ronaldo reference, 70 for "70 international goals").

**a) Any Manchester City match (any competition), if Haaland played:**
update the "Manchester City — key stats (club)" stat-mini tile — Games
+1, Goals += goals scored, Average = Goals/Games (2 decimals), and its
note ("All competitions, through City game N, DD Mon YYYY" /
"Alle turneringer, t.o.m. N. City-kamp, D. mnd. YYYY").

**b) Champions League match — additionally:**
- "Manchester City — key stats (CL)" tile (same formula, CL-only tally).
- "Champions League — goals per club" tile: the Man City sub-value, and
  its note ("N CL goals in total so far..." / "N CL-mål totalt så
  langt...").
- `CL_TOP`'s Haaland entry `value` (search `const CL_TOP`).
- `chartCl.entryBars`'s first bar, the Haaland value (search
  `entryBars: [bar('1. E. Haaland'`).
- `chartCl.topRankLabel`'s hardcoded "with N goals"/"med N mål" text
  (search `topRankLabel:`).
- The two CL "Still achievable" entries ("Overtake Robert
  Lewandowski"/"Forbigå Robert Lewandowski" and "Ronaldo and Messi's
  all-time records"/"Ronaldos og Messis totalrekorder"): update each
  `desc`'s goal count and its `progress` per the formula above.

**c) Norway national-team match — additionally:**
- "National team — key stats" tile (Games/Goals/Average + dated note), if
  Haaland played.
- `NAT_NORWAY`'s Haaland entry `value` (search `const NAT_NORWAY`).
- The next round-number milestone's achievable entry (e.g. "70
  international goals") — `desc` and `progress` per the formula above.
- Do NOT edit a frozen historical record-log entry like "Status: 61
  international goals" — that's a snapshot of when a past milestone was
  reached, not a live counter. Only add a brand-new dated History entry
  like it when Haaland crosses a genuinely new, notable milestone.

**d) Premier League match:**
- DO update the live in-progress season entry in `PL_SEASONS` (search
  `const PL_SEASONS`): the current season's key (e.g. `'2026/27'`, added
  8 Sep 2026) has `done: false` and a `solid` array of
  `[matchweek, cumulativeGoals]` points instead of a final `points` array
  — append a new `[matchweek, newCumulativeTotal]` point after every PL
  match (whether or not Haaland scored), and bump `total`/`apps`. This
  feeds the "Record chart — club level" per-season comparison graph
  (`PER SEASON` tab) directly — it has no separate stat-mini tile of its
  own. Give it a `PL_SEASON_COLORS` entry (already set) and make sure its
  key is in the `seasonsOn` default-state object so it's shown by
  default. When the season actually ends, flip `done` to `true` and
  replace `solid` with a final smoothed `points` array in the same style
  as the completed seasons above it.
- Do NOT touch the "150 Premier League goals" / "Alan Shearer's all-time
  record" achievable-chase entries or the PL milestone-race caption (the
  ones citing "112 goals in 132 games" / "2022/23–2025/26 seasons") for
  every match. Those are deliberately frozen as of the end of the last
  completed season by design — a separate chart (`chart.club`, `TOTAL`
  tab) already projects the in-progress season with its own dashed line.
  Leave them alone unless Haaland crosses a big round-number milestone
  worth a new History log entry, or a season has just actually ended.

**e) FA Cup / EFL Cup / Community Shield / Club World Cup match** — only
(a) applies; there's no separate per-competition breakdown for these like
there is for CL.

**f) If a hardcoded stat looks relevant but isn't covered above, or
you're not confident of the right number** — leave it alone and say so in
your report rather than guessing. This is a public, live site; accuracy
beats completeness.
