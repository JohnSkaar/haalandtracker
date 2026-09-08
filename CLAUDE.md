# HaalandTracker

Static bilingual site (EN at `/`, NO at `/no/`) tracking Erling Haaland's match
record for Manchester City, the Champions League and Norway. Live at
haalandtracker.com / haalandtracker.no. Work directly on `main` — this repo
pushes straight to main, no PRs, per the owner's preference.

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
fixture-aware one-shot follow-up ("Haaland match result check", fires ~140
min after the next known kickoff and retries every 30 min up to 12 times)
already handle finding new results, adding match cards, and pushing to
`main`. Don't create a second, competing scheduled check for the same
thing — extend or read this file instead.

## Stats cascade — updating hardcoded derived stats after a match

Match cards are added/edited directly, but several other numbers on the
site are hardcoded and do NOT update automatically from the match-card
data. After adding or correcting a played match, update every one of these
that the match's competition affects. Search for the current numbers each
time (don't trust line numbers — the file grows); make every change in
BOTH `source/Main.en.dc.html` and `source/Main.no.dc.html`, mirroring the
exact existing wording/format at each spot.

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

**d) Premier League match — do NOT touch** the "150 Premier League
goals" / "Alan Shearer's all-time record" achievable-chase entries or the
PL race-chart caption (the ones citing "112 goals in 132 games" /
"2022/23–2025/26 seasons"). These are deliberately frozen as of the end
of the last completed season by design — the chart's dashed line already
projects the in-progress season. Leave them alone unless Haaland crosses
a big round-number milestone worth a new History log entry, or a season
has just actually ended.

**e) FA Cup / EFL Cup / Community Shield / Club World Cup match** — only
(a) applies; there's no separate per-competition breakdown for these like
there is for CL.

**f) If a hardcoded stat looks relevant but isn't covered above, or
you're not confident of the right number** — leave it alone and say so in
your report rather than guessing. This is a public, live site; accuracy
beats completeness.
