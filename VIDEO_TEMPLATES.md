# Social video templates

Internal notes for AI-generated social-media video content promoting
HaalandTracker (separate from the website's own code — nothing here ships
to haalandtracker.com/.no). Generated via Higgsfield (model `seedance_2_5`).

## Standard ending clip (adopted 8 Oct 2026, updated same day — owner request)

Every "record" video generated from now on should end with this exact clip
(or a fresh render of the same prompt if the job expires): a modern white
football flies into the net dead-on from behind the goal, clipping the
underside of the crossbar and picking up a light spin on the way in, with
"HaalandTracker.com" printed on a fixed spot on the ball, text settling
centered and legible in the final frame which fills the whole screen.

- **Job id: `7dcf7a22-e1c1-4699-965f-8ed21dc8c36f`**
- URL (while live): `https://d8j0ntlcm91z4.cloudfront.net/user_3Ipc1bcrZt27tWpXOoyuXF8Mztc/hf_20261008_195916_7dcf7a22-e1c1-4699-965f-8ed21dc8c36f.mp4`
- Model: `seedance_2_5`, 16:9, 6s (6.08s actual), 1080p
- Exact prompt used:

  > Extreme close-up sports broadcast shot filmed from a camera mounted
  > directly behind a football goal, positioned high up near the crossbar,
  > looking out over the pitch. A massive, brilliantly floodlit stadium of
  > the highest international quality fills the background — a packed,
  > roaring crowd, pristine green pitch, dazzling stadium lights cutting
  > through the night sky, broadcast-quality cinematic realism. The football
  > is a modern, sleek, pure white match ball with a smooth contemporary
  > aerodynamic panel design (clean minimal curved panel lines, no sponsor
  > marks other than the one logo described below) — it looks like a
  > current-generation professional match ball, not an old-style
  > black-and-white pentagon ball. The ball has the words
  > "HaalandTracker.com" printed in bold clean black sans-serif text on one
  > fixed panel of its white surface, like a sponsor logo on a match ball —
  > the text stays printed at that single spot on the ball's surface the
  > entire time, it does not move to a different part of the ball. The ball
  > is struck from distance and rockets directly toward the camera at very
  > high velocity, noticeably fast, flying in an almost perfectly straight
  > line with very little rotation at first — the way a very hard,
  > fast-struck shot naturally flies with minimal spin early on. As the ball
  > arrives at the goal it clips the underside of the crossbar, and from
  > that contact onward it picks up a light spin and tumble — not fast or
  > wild, just a subtle rotation — as it continues into the net right
  > beside the camera. The ball grows larger and larger as it approaches,
  > now moving even faster in this final stretch. The ball smashes into the
  > net just underneath the crossbar. As it strikes, the net violently
  > stretches and balloons toward the camera, strands snapping taut. In the
  > final instant the ball itself fills the entire frame, and despite the
  > spin picked up after clipping the crossbar, its rotation settles
  > exactly so the "HaalandTracker.com" text is facing the camera, centered
  > in the middle of the frame, large, crisp, perfectly legible, right as
  > the shot ends. The shooter and other players are barely glimpsed, tiny
  > and distant on the pitch far below — the shot stays focused on the
  > goal, the net and the stadium atmosphere, never on people. Dynamic
  > sports-broadcast camera work, slight lens flare from the floodlights,
  > crisp high-detail 1080p realism, dramatic crowd roar building as the
  > ball connects.

**Superseded — do not use:**
- Job `b668fa32-cd69-4bb0-8a22-7a715e601a45` — earlier version without the printed logo.
- Job `e5e51492-abbc-45e4-b1e7-2448c35d6107` — had the logo but a
  black-and-white pentagon ball flying nearly spin-free the whole way, no
  crossbar contact. Replaced per owner request (8 Oct 2026): ball should be
  a modern white design, fly a bit faster, and pick up a light spin
  specifically after clipping the crossbar, while still settling on the
  centered logo in the final frame.

## Assembling a record-presentation video

Pattern: one intro/stat-reveal clip (generated fresh per record, describing
the specific record) + a **4-second static hold** on the revealed record +
the standard ending clip above + a **2-second static hold** on the ending
clip's final frame, concatenated into a single video.

To concatenate without routing around this session's network policy (the
Higgsfield CDN is blocked from this session's own `curl`/`WebFetch`, by
design — never try to work around that): use Higgsfield's own
`sandbox_exec` tool, which has its own internet access, `ffmpeg`/`ffprobe`
preinstalled, and can `curl` both clip URLs directly. Re-encode both inputs
to a common format (1920x1080, 30fps, yuv420p, 48kHz stereo AAC) via an
`ffmpeg -filter_complex ... concat=n=2:v=1:a=1` graph rather than the concat
demuxer's stream-copy mode — the two clips come from separate generation
jobs and aren't guaranteed to share identical encoding parameters (in
practice both have been HEVC/24fps/32kHz so far, but don't assume this
holds). Reserve an upload slot with `media_upload` *before* running the
producing command, do the `curl` download + `ffmpeg` concat + `curl -X PUT`
to the upload_url all in one `sandbox_exec` call (the sandbox is ephemeral
between calls), then `media_confirm`.

### Standing timing rules (8 Oct 2026, owner request)

- **Hold the revealed record for 4 seconds** before cutting to the standard
  ending clip. Don't rely on the intro clip's own generated pacing for
  this — engineer it precisely with ffmpeg: `tpad=stop_mode=clone:
  stop_duration=4` on the intro's video stream, paired with
  `apad=pad_dur=4` on its audio stream (silence is fine here — the intro's
  own stat-reveal audio has normally already settled by its last frame).
- **Hold the ending clip's final frame (ball frozen in the goal) for 2
  seconds** at the very end of the video, and keep the crowd audio going
  through that hold rather than cutting to silence. Don't use plain
  `apad` on the ending clip's audio (it pads with silence, which cuts the
  crowd roar off abruptly). Instead loop the last 2 seconds of the ending
  clip's own audio tail onto the end: `asplit` the ending audio into two
  copies, `atrim` one copy to its final ~2s, then `concat` that trimmed
  tail back onto the original — pair with `tpad=stop_mode=clone:
  stop_duration=2` on the ending's video stream so picture and sound stay
  the same length. See the full filter graph used for the 8 Oct 2026
  presentation below as a working example (compute the trim start as
  `ending_duration - 2` via `ffprobe`, don't hardcode it — a regenerated
  ending clip may not be exactly 6.05s).
- Total runtime = intro duration + 4s + ending duration + 2s.

### First presentation (8 Oct 2026, revised 9 Oct 2026)

Topic: Haaland's all-time top international scorer record among Nordic
nations (passed Zlatan Ibrahimović's 62 goals, vs Denmark 24 Sep 2026 — see
CLAUDE.md / SOURCES.md for the sourcing on the underlying record itself).

Revised per owner request (9 Oct 2026, "make it be a bit more clear that it
is a record between the best topscorer from the two countries and that
Haaland just (date) surpassed Ibrahimovich") to explicitly show Norway vs
Sweden and the Ibrahimović comparison with the date, not just Haaland's own
tally.

- **Intro clip job id: `babe4254-c6fb-41d8-955e-52979541377a`** (7.04s,
  stat-reveal motion graphic: Norway vs Sweden flags, "NORDIC NATIONS / TOP
  SCORER RECORD" headline, Sweden "62 / PREVIOUS RECORD" vs Norway
  "HAALAND" counter ticking 62→63→64, overtake animation, final screen
  "NEW ALL-TIME RECORD" with both tallies side by side. No real
  people/faces/club crests — abstract broadcast-graphics style only.
- **The AI model's own rendering of "IBRAHIMOVIC" and "HAALAND" is not used
  — do not trust it.** Across three separate generations in this session,
  the model misspelled "Ibrahimovic" twice ("Ibabuıovic", "Ibrahamovic")
  and "Haaland" once ("Haeland") in dynamic/counter-adjacent text, and in
  this take the Swedish "previous record" number itself incorrectly
  animated from 62 up to 64 in the final held frame (factually wrong — it
  must stay fixed at 62). Because of this track record, the final
  video **does not rely on the AI to render the player-name comparison or
  the Swedish number at all** — see "Guaranteed-correct text overlay"
  below, the fix adopted for this and all future intros.
- **A self-authored "glitch" flicker animation for both numbers was tried
  and reverted the same day (9 Oct 2026).** Per owner feedback: "Videoen
  nå ble rot og dårligere enn utgangspunktet. Tallene står over flaggene
  og det er en mye mindre kul telling" (the video became messy and worse
  than the starting point — the numbers sat on top of the flags and the
  counting looked much less cool than the AI's own original animation).
  **Reverted to the AI's native ticking-counter animation** from job
  `babe4254-c6fb-41d8-955e-52979541377a` (numbers properly positioned next
  to their flags, as originally generated) — only the single static
  "62" patch and the bottom caption bar (both described above, needed
  because the AI corrupts those two specific things) are still overlaid.
  No more per-frame flicker/glitch filters. If a future request wants a
  ticking/counting effect again, prefer a lighter touch: either trust the
  AI's own native counter (it looked good here) or, if it must be
  engineered, keep the box position exactly aligned with the flag so
  nothing appears to float independently.
- **Audio smoothed across the whole video (9 Oct 2026, owner request:
  "sørg for at det ikke hoppes for mye i lydbildet, la det få mer
  jevnhet")** — the hard cut from the near-silent 4s hold into the ending
  clip's crowd roar was jarring. Fixed two ways:
  1. The 4-second hold no longer pads with flat silence (`apad`). Instead
     the intro's own last 1 second of audio is looped 4× and appended
     (`asplit` the full intro audio, `atrim` the last 1s from a copy,
     `asplit` *that* into 4 identical copies, `concat` main+4 copies), then
     an `afade=t=out:start_time=<introDur>:duration=4` fades it down
     smoothly across the hold instead of looping at full volume.
  2. The cut from intro+hold into the standard ending clip uses
     `acrossfade=d=0.5:c1=tri:c2=tri` instead of a hard `concat` on the
     audio track (video still hard-cuts via `concat`, which reads fine —
     only the audio needed smoothing). `acrossfade` shortens the combined
     audio by the crossfade duration, so follow it with
     `apad=pad_dur=0.5` to restore exact sync with the un-crossfaded video
     track.
- **Final assembled video (intro + 4s hold + standard ending + 2s hold,
  smoothed audio):** media_id `90d0b36a-c993-4a07-ac63-6c73a2d015a6`,
  `https://d2ol7oe51mr4n9.cloudfront.net/user_3Ipc1bcrZt27tWpXOoyuXF8Mztc/90d0b36a-c993-4a07-ac63-6c73a2d015a6.mp4`
  (19.07s, 1920x1080, h264/aac). **Use this one.**

**Superseded — do not use:**
- Assembled video media_id `28c154bf-40a1-4c12-8640-cf324825025f` — the
  self-authored glitch-flicker version; reverted per owner feedback above
  (numbers floated over the flags, looked worse than the AI's native
  animation). Its audio also still had the hard silence→crowd-roar cut.
- Assembled video media_id `8535ecd6-a1cf-44de-83e6-6241f9a090b8` — same
  intro and correct final numbers as the current version, but predates the
  audio-smoothing fix (plain `apad` silence during the hold, hard `concat`
  cut into the ending clip's audio).
- Intro clip job `42ad6259-1061-4198-b06c-b59e6fb14f61` — first attempt at
  the Norway-vs-Sweden framing; rendered "IBRAHIMOVIC" as "IBRAHAMOVIC"
  throughout (both the mid-clip label and the final headline).
- Assembled video media_id `f47a4178-576a-49ba-96bd-cd5369eaa185` and intro
  clip job `693f664d-0282-4590-80e1-96449562d465` — good spelling, but
  didn't name Ibrahimović or the date on-screen at all (only "64
  INTERNATIONAL GOALS" / "NORDIC NATIONS ALL-TIME TOP SCORER"), which the
  owner asked to make clearer.
- Assembled video media_id `f14bd2a3-9bf5-4dc1-9d4b-cd5bd720393a` — same
  intro, built with the old pentagon-ball standard ending before it was
  updated (8 Oct 2026) to the white-ball/crossbar-spin version above.
- Intro clip job `05364a16-d282-4301-8118-c24e541ac93e` and assembled video
  media_id `2b270811-33de-4d35-aeac-812490c3f997`. The on-screen subtitle
  text was misspelled ("Haeland" instead of "Haaland", "Ibabuıovic" instead
  of "Ibrahimović"). Predates the 4s/2s hold rules above.

**Text-rendering risk — escalated policy (9 Oct 2026):** printed/on-screen
text in AI-generated video is unreliable, especially longer words and names
with diacritics — and this has now failed on *both* "Ibrahimović" (twice)
and "Haaland" (once) across this session's generations, including a case
where the AI also silently corrupted a *static* number (62→64) that the
prompt explicitly said should not change. Simplifying the prompt wording is
no longer treated as a sufficient fix on its own for anything load-bearing
(a name, a date, a number that must stay fixed) — those now go through the
guaranteed-correct overlay below instead. Still always verify by extracting
frames (`ffmpeg -y -ss <t> -i clip.mp4 -frames:v 1 -update 1 -q:v 2
out.jpg`, viewed via `sandbox_exec`'s `image_paths`) before shipping —
check several timestamps through the clip, not just the last frame, since a
AI numeric/text glitch can appear mid-clip and "fix itself" by the end (or
vice versa, as happened here).

**Guaranteed-correct text overlay (adopted 9 Oct 2026):** for any text that
must be factually exact — a player name, a date, a score/record number —
don't rely on the AI model to render it at all. Instead:
1. In the generation prompt, either omit that text entirely or have the
   model render only safe generic placeholders/labels (e.g. ask for just
   the flag + number + "PREVIOUS RECORD", no player name).
2. In `sandbox_exec`, burn in the exact correct text afterward with
   ffmpeg's `drawtext` filter (font: `/usr/share/fonts/truetype/higgsfield/
   Montserrat-ExtraBold.ttf`), gated to appear only once the AI's own
   reveal animation has settled (check several frames to find when
   transition animations finish — in this clip the "overtake" ring
   animation needed until t≈4.9s to clear).
3. If the AI also rendered an element wrong that must be covered (not just
   added), sample the local background color first (Python/PIL
   `im.getpixel((x,y))` on an extracted frame) and draw a `drawbox` patch
   in that color *before* drawing the correct text on top — size the patch
   generously (include the glow/halo around bold digits, not just the
   glyph bounding box) to avoid a visible ghost of the wrong content
   peeking out from under the patch.
4. This overlay must be applied to the intro clip *before* the 4-second
   `tpad` hold, so the held freeze-frame also carries it (it does, since
   `tpad` clones the already-overlaid last frame).

This video's bottom-caption bar ("HAALAND SURPASSES IBRAHIMOVIC" /
"24 SEP 2026") and the single "62" patch are done this way — the counter
animation itself (both numbers ticking up) is left as the AI generated it;
see the "reverted" note above for why a self-authored flicker replacement
was tried and abandoned.

**Audio-smoothing technique (adopted 9 Oct 2026)** — use this any time two
clips are concatenated and the cut between them (e.g. a quiet hold into a
loud ambience) sounds jarring:
- Don't fill an engineered hold with plain `apad` silence if the clip has
  its own ambient audio — instead loop a short tail of that clip's real
  audio (`asplit` a copy, `atrim` the last ~1s, `asplit` that into N
  copies, `concat` them after the main audio) and `afade` it down across
  the hold, so there's a natural decay instead of a sudden drop to dead air.
- Join the two clips' audio with `acrossfade=d=0.5:c1=tri:c2=tri` instead
  of plain `concat`, even if the video track still hard-cuts via `concat`
  — a video can cut cleanly on a scene change while the audio benefits
  from a short overlap/blend. Because `acrossfade` shortens the combined
  audio by the crossfade duration, add `apad=pad_dur=<that duration>`
  right after it to keep the audio and (uncrossfaded) video the same total
  length.

Next time: reuse the standard ending clip as-is, generate a new ~6-8s intro
for whichever record is being featured (keeping player names/dates/record
numbers that must be exactly right as guaranteed overlays, never trusting
AI-rendered text for those specifically — but letting the AI's own
animation/counter play out otherwise, per the reverted-glitch note above),
and follow the same sandbox_exec concat recipe including the 4s/2s hold
filters and the audio-smoothing technique above.
