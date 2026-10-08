# Social video templates

Internal notes for AI-generated social-media video content promoting
HaalandTracker (separate from the website's own code — nothing here ships
to haalandtracker.com/.no). Generated via Higgsfield (model `seedance_2_5`).

## Standard ending clip (adopted 8 Oct 2026, owner request)

Every "record" video generated from now on should end with this exact clip
(or a fresh render of the same prompt if the job expires): a football flies
into the net dead-on from behind the goal, with "HaalandTracker.com" printed
on a fixed spot on the ball, minimal spin so the text stays legible, filling
the whole frame at the very end.

- Job id: `e5e51492-abbc-45e4-b1e7-2448c35d6107`
- URL (while live): `https://d8j0ntlcm91z4.cloudfront.net/user_3Ipc1bcrZt27tWpXOoyuXF8Mztc/hf_20261008_150028_e5e51492-abbc-45e4-b1e7-2448c35d6107.mp4`
- Model: `seedance_2_5`, 16:9, 6s, 1080p
- Exact prompt used:

  > Extreme close-up sports broadcast shot filmed from a camera mounted
  > directly behind a football goal, positioned high up near the crossbar,
  > looking out over the pitch. A massive, brilliantly floodlit stadium of
  > the highest international quality fills the background — a packed,
  > roaring crowd, pristine green pitch, dazzling stadium lights cutting
  > through the night sky, broadcast-quality cinematic realism. The
  > football has the words "HaalandTracker.com" printed in bold clean white
  > sans-serif text on one fixed panel of its surface, like a sponsor logo
  > on a match ball — the text stays printed at that single spot on the
  > ball's surface the entire time, it does not move to a different part
  > of the ball. The ball is struck from distance and rockets directly
  > toward the camera at tremendous velocity, flying in an almost perfectly
  > straight, knuckleball-like line with very little rotation or spin — the
  > way a very hard, fast-struck shot naturally flies with minimal spin —
  > so the "HaalandTracker.com" text stays facing the camera and stays
  > legible throughout the flight, never spinning out of view. The ball
  > grows larger and larger as it approaches. The ball rises and smashes
  > into the net just underneath the crossbar, right beside the camera. As
  > it strikes, the net violently stretches and balloons toward the camera,
  > strands snapping taut. In the final instant the ball itself fills the
  > entire frame, with the "HaalandTracker.com" text centered in the middle
  > of the frame, large, crisp, and clearly readable, right as the shot
  > ends. The shooter and other players are barely glimpsed, tiny and
  > distant on the pitch far below — the shot stays focused on the goal,
  > the net and the stadium atmosphere, never on people. Dynamic
  > sports-broadcast camera work, slight lens flare from the floodlights,
  > crisp high-detail 1080p realism, dramatic crowd roar building as the
  > ball connects.

An earlier version without the printed logo (job `b668fa32-cd69-4bb0-8a22-7a715e601a45`)
exists but is superseded — use the one above.

## Assembling a record-presentation video

Pattern: one intro/stat-reveal clip (generated fresh per record, describing
the specific record) + the standard ending clip above, concatenated into a
single video.

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

### First presentation (8 Oct 2026)

Topic: Haaland's all-time top international scorer record among Nordic
nations (passed Zlatan Ibrahimović's 62 goals, vs Denmark 24 Sep 2026 — see
CLAUDE.md / SOURCES.md for the sourcing on the underlying record itself).

- Intro clip job id: `05364a16-d282-4301-8118-c24e541ac93e` (7s, stat-reveal
  motion graphic, 62→63→64 counter, Norway/Sweden flag icons, no real
  people/faces/club crests — abstract broadcast-graphics style only, to
  stay consistent with the site's own policy of not using real club/
  competition logos or player photos).
- Final assembled video (intro + standard ending): media_id
  `2b270811-33de-4d35-aeac-812490c3f997`,
  `https://d2ol7oe51mr4n9.cloudfront.net/user_3Ipc1bcrZt27tWpXOoyuXF8Mztc/2b270811-33de-4d35-aeac-812490c3f997.mp4`
  (13.15s, 1920x1080, h264/aac).

Next time: reuse the standard ending clip as-is, generate a new ~6-8s intro
for whichever record is being featured, and follow the same sandbox_exec
concat recipe above.
