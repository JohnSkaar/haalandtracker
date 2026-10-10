---
name: record-video
description: Generate a short promotional video for a Haaland record or stat (a random pick from the site's own live data, or a specified one), using a verified Nano Banana still + guaranteed ffmpeg text overlay so names/numbers can't be wrong, a 3-second static hold on the reveal, then the standard HaalandTracker.com "ball into net" ending clip. Use when asked to make a record video, a stat video, a social clip, or when the user invokes "/record-video".
---

# Record video generator

Produces a ~13-14s vertical-or-landscape promo clip: a stat-reveal graphic
(held static for 3s) followed by the existing standard ending clip (ball
flies into the net, logo centered, documented in `VIDEO_TEMPLATES.md`).

**Read `VIDEO_TEMPLATES.md` in the repo root first.** It's the source of
truth for the proven ffmpeg recipes (hold/concat/audio-crossfade) and the
standard ending clip's current job id — this skill composes those same
techniques, adapted to start from a verified still image instead of an
AI-generated video intro, and should never duplicate stale copies of those
values here. If the standard ending clip has been regenerated since this
skill was written, use the job id `VIDEO_TEMPLATES.md` currently documents,
not whatever is written below.

## Why a still image, not text-to-video, for the reveal

Documented at length in this project's own history (see `VIDEO_TEMPLATES.md`
and the conversation that produced this skill): AI *video* generation
repeatedly corrupted on-screen text — misspelling "Ibrahimović" three
different ways, misspelling "Haaland" once, and once silently changing a
*static* number (62→64) partway through a clip. A still image doesn't have
video's temporal-coherence failure mode (text can't "drift" frame to frame
on a single frame), is far cheaper/faster to verify, and is trivial to
patch if wrong. This skill never trusts AI-rendered text, from either a
video or an image model — it always re-asserts the exact correct text with
ffmpeg afterward (Step 6). The still-image model's job is only to get the
*background art* (layout, flags, color, composition) right; verification
and correctness of every word and number is this skill's job, not the
model's.

## Step 0 — Known-correct spelling reference (do not regenerate this list)

Copy these exact strings verbatim whenever they appear anywhere in
generated text or overlays. Never rely on a model (image or video) to spell
them; never retype them from memory.

| Subject | Correct spelling | Known failure modes seen in this project |
|---|---|---|
| Erling Haaland | `Haaland` | "Haeland", "Haeland" |
| Zlatan Ibrahimović | `Ibrahimović` (or plain `Ibrahimovic` if avoiding the diacritic for on-screen rendering reliability) | "Ibabuıovic", "Ibrahamovic" |
| Cristiano Ronaldo | `Ronaldo` | — |
| Lionel Messi | `Messi` | — |
| Robert Lewandowski | `Lewandowski` | — |
| Kylian Mbappé | `Mbappé` / `Mbappe` | — |
| Alan Shearer | `Shearer` | — |
| Harry Kane | `Kane` | — |
| Wayne Rooney | `Rooney` | — |
| Mohamed Salah | `Salah` | — |
| Ashley Cole | `Cole` | — |
| Sergio Agüero | `Agüero` / `Aguero` | — |
| Frank Lampard | `Lampard` | — |
| Thierry Henry | `Henry` | — |
| Robbie Fowler | `Fowler` | — |
| Jermain Defoe | `Defoe` | — |
| Site name (always exactly this, one word, correct case) | `HaalandTracker.com` | — |

If a record involves a name not on this list, add it to this table (with a
source) before using it — don't guess spelling, and don't trust it just
because a search result or a model output used some spelling.

## Step 1 — Pick a record (always read live data, never hardcode a number)

Every number used anywhere in this skill's output must be read fresh from
`source/Main.en.dc.html` (or `source/Main.no.dc.html` if making the Norwegian
variant) at run time — numbers in this skill file's prose, if any appear in
examples below, are illustrations only and will be stale.

Candidate pool (grep the live file for each, pick one — randomly if the
user said "random", or as specified):

- **Club key stats**: search `Manchester City — key stats (club)` area /
  the `club.*` stat-mini tile — current Games/Goals/Average.
- **CL key stats + ranking**: search `const CL_TOP` for the full all-time
  CL scorer list and Haaland's current `value`; search `topRankLabel:` for
  his current ranking sentence (already has the exact phrasing and number
  combined).
- **National team key stats**: search `const NAT_NORWAY` for his current
  caps/goals; search `const NAT_WORLD` for how he compares to the world/
  Europe all-time list (only use an entry flagged `active: true` for a
  "still active, could still move" framing, or any entry for a historical
  comparison).
- **"Still achievable" record-chase entries** (forward-looking, not yet
  crossed — frame as "on pace for X" not "beat X"): search `clubAchievable`,
  `clAchievable`, `natAchievable` — each is an array of
  `{ title, desc, progress }`. `desc` already contains the precise current
  number and comparison; `progress` is the percent-of-the-way-there.
- **PL season arc**: search `const PL_SEASONS` for the current in-progress
  season's cumulative total/apps.
- **A genuinely new milestone** freshly crossed by the latest match update
  (check the "Last updated" footer badge date against today — if a record
  was just crossed, that's usually the most shareable pick).

Record the exact source line(s) you read, in case they're needed later for
a caption or for `VIDEO_TEMPLATES.md`.

## Step 2 — Compose the reveal's text content

From the picked record, write down the **exact final strings** that will
appear on screen — headline, subtitle, name(s), number(s), date if
relevant. Keep it short: 2-4 short lines total reads far more reliably than
a paragraph, both for the image model and for visual legibility. Example
shape (not literal content — derive your own from Step 1's live data):

```
Line 1 (headline):  <RECORD NAME, e.g. "CHAMPIONS LEAGUE">
Line 2 (subtitle):  <e.g. "ALL-TIME TOP SCORER RANKING">
Line 3 (number):    <the number, large>
Line 4 (context):   <e.g. "#3 ALL-TIME · 59 GOALS">
```

Do not invent comparative claims ("best ever", "greatest") beyond what the
site's own data says — match the tone and precision of the source text
(see CLAUDE.md's accuracy rules — this is a public, live brand asset).

## Step 3 — Spelling/accuracy gate (mandatory, before any generation)

Checklist — do this explicitly, don't skip it because the numbers "look
right":

1. Every name in Step 2's text is copied verbatim from Step 0's table.
2. Every number in Step 2's text matches what you just read in Step 1,
   character for character (re-open the source file and compare side by
   side — don't trust what you remember typing a minute ago).
3. If the record is a crossed milestone with a date, the date matches the
   match-card date exactly, in the site's own "D Mon YYYY" format.
4. Write the final, locked text block down — this exact block is what
   Step 6 will force onto the video regardless of what the image model
   renders. Nothing after this point should change the wording without
   re-running this checklist.

## Step 4 — Generate the reveal background as a still (Nano Banana Pro)

Use OpenArt's `nano-banana-pro` (`openart_model_list` → confirm it's still
listed and affordable before spending; `openart_model_form_get` with
`model: "nano-banana-pro"`, `mode: "text2image"` to confirm the current
param schema, which at last check was:
`{ prompt (required), imageCount, aspectRatio, resolution, autoEnhancePrompt }`).

Call `openart_generate_image` with:
- `model: "nano-banana-pro"`, `mode: "text2image"`
- `params.aspectRatio: "16:9"` (matches the standard ending clip)
- `params.resolution: "2K"` (gives headroom for the later 1920x1080 scale)
- `params.prompt`: describe the visual composition in detail (dark navy
  broadcast-graphics background with subtle light rays, relevant flag/club
  icon if applicable, layout matching Step 2's line structure, premium
  sports-broadcast typography, no real people/faces/club crests per the
  site's own policy) **and include the exact Step-2 text block verbatim in
  quotes, instructing "perfect, correctly spelled, no typos"** — even
  though Step 6 will override it regardless, giving the model the best
  shot first reduces how much patching Step 6 has to do.

On a CLI/headless host (this environment), poll with
`openart_creation_wait(historyId)` until terminal; do not use
`openart_creation_get` in a loop.

## Step 5 — Verify the still

Download the image and inspect it directly (Read tool handles images
natively). Compare every word and number against Step 3's locked text
block. This is a visual sanity check only, not the correctness guarantee —
Step 6 provides that regardless of what you see here. If the composition is
badly broken (illegible layout, wrong number of lines, text overlapping
graphics) rather than just misspelled, it's worth one regeneration with a
refined prompt; don't loop more than 2-3 times chasing perfect AI spelling
— Step 6 makes that unnecessary.

## Step 6 — Guaranteed ffmpeg text overlay (always do this, no exceptions)

Regardless of Step 5's outcome, burn Step 3's locked, exact text onto the
still with ImageMagick or ffmpeg before it's used in any video, the same
way `VIDEO_TEMPLATES.md` documents for video frames:

1. If the AI's own text is legible and correctly placed but you want to
   guarantee it, or if it's wrong: sample the local background color near
   each text region (Python/PIL `im.getpixel((x,y))`) and draw a solid
   patch in that color over the AI's text first.
2. Draw the locked text on top in
   `/usr/share/fonts/truetype/higgsfield/Montserrat-ExtraBold.ttf` (bold,
   white, sized to roughly match the AI's original layout scale).
3. Save as a new PNG (`reveal_final.png`) — this file, not the raw AI
   output, is what every later step uses.

This can be done with ImageMagick `convert` directly on the still (simpler
than video since there's only one frame, no timing/enable windows needed):
```
convert reveal_raw.png \
  -fill "#202e4eE8" -draw "rectangle <x1>,<y1> <x2>,<y2>" \
  -font /usr/share/fonts/truetype/higgsfield/Montserrat-ExtraBold.ttf \
  -pointsize <n> -fill white -gravity West -annotate +<x>+<y> "<exact text>" \
  reveal_final.png
```
(repeat the fill+annotate pair per line/region that needs a guarantee).

## Step 7 — Animate the reveal: brief motion, then an exact 3-second hold

Reuse the proven `tpad` clone-hold technique from `VIDEO_TEMPLATES.md`
(already validated across many prior renders) rather than inventing
anything new — just swap the source from "AI video intro" to "Ken-Burns
motion built from the verified still":

```
# ~1.5s gentle zoom-in from the verified still, then let tpad hold it exactly 3s
ffmpeg -y -loop 1 -i reveal_final.png -t 1.5 \
  -vf "scale=1920:1080,zoompan=z='min(zoom+0.0015,1.05)':d=1:s=1920x1080:fps=30,fade=t=in:st=0:d=0.4" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -an reveal_motion.mp4

ffmpeg -y -i reveal_motion.mp4 -vf "tpad=stop_mode=clone:stop_duration=3" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p reveal_held.mp4
# reveal_held.mp4 is now exactly 1.5s motion + 3.0s static hold = 4.5s
```

If a future request wants richer motion than a simple Ken Burns zoom,
`VIDEO_TEMPLATES.md`'s discussion of start/end-frame video models (Kling
3.0, Wan 3.0, MiniMax H3, Veo 3.1, Gemini Omni 1.1 Flash — all accept
`start_image`/`end_image`) is the documented option: generate a second
verified+patched still for the "before reveal" state (Step 0-6 again) and
feed both into one of those models. Treat this as optional richness, not
the default — the motion in between the two stills is not guaranteed
correct the way the stills themselves are, so only do this once the plain
Ken Burns version is working and extra flourish is specifically wanted.

## Step 8 — Audio

The reveal clip built in Step 7 has no native audio (`-an`). Don't
invent filler audio — leave it silent and let the crossfade in Step 9 fade
the ending clip's crowd audio **in** from silence, which reads as a clean
"quiet reveal → stadium roar" beat rather than needing anything looped.
Add a silent audio track to `reveal_held.mp4` first so the later
`acrossfade` has two real audio streams to work with:
```
ffmpeg -y -i reveal_held.mp4 -f lavfi -i anullsrc=r=48000:cl=stereo \
  -shortest -c:v copy -c:a aac reveal_held_audio.mp4
```

## Step 9 — Concatenate with the standard ending clip

Fetch the standard ending clip's current job id/URL from `VIDEO_TEMPLATES.md`
(do not hardcode it here) and follow that document's existing
"Assembling a record-presentation video" recipe exactly: normalize both
inputs (1920x1080, 30fps, yuv420p, 48kHz stereo AAC), apply the ending
clip's own 2-second hold with its crowd-audio tail loop (already documented
there), and join the two clips' audio with
`acrossfade=d=0.5:c1=tri:c2=tri` + a trailing `apad=pad_dur=0.5` (the
audio-smoothing technique from that same document), concatenating video
with a plain hard-cut `concat`. Reserve the `media_upload` slot immediately
before running this combined download+ffmpeg+upload command in one
`sandbox_exec` call, exactly as established — a separated upload step risks
the presigned URL expiring mid-render, which has happened before.

## Step 10 — Final verification pass

Extract and visually check: a frame from the reveal's motion phase, a frame
from the 3s hold, the frame right after the cut to the ending clip, and the
ending's own final held frame. Re-check every word/number against Step 3's
locked text block one more time on the actual rendered output, not just the
intermediate still — confirm the overlay survived the scale/concat/encode
pipeline unchanged.

## Step 11 — Deliver and document

Report the final video link to the user. Then append a dated entry to
`VIDEO_TEMPLATES.md` (new subsection under "Assembling a record-presentation
video") recording: which record was picked and why, the Nano Banana prompt
used, the overlay patch coordinates/text, the final media id/URL, and
anything that needed correcting — keep the same track record of
successes/failures this document already maintains, so the next run (by
this skill or a human) starts from the latest working recipe instead of
rediscovering the same mistakes.

## Scope notes

- This skill is for **manual/on-demand invocation** ("make a record video",
  "/record-video"). It is not wired to a scheduled Routine — given the
  accuracy stakes on a public brand asset (per CLAUDE.md), a human should
  see the result before it's posted anywhere. If recurring automated
  generation is wanted later, that's a separate, explicit decision — don't
  add a Routine for this without being asked.
- Nothing here ships to haalandtracker.com/.no — same separation
  `VIDEO_TEMPLATES.md` already states for all video-content work.
