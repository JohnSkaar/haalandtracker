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

### First presentation (8 Oct 2026)

Topic: Haaland's all-time top international scorer record among Nordic
nations (passed Zlatan Ibrahimović's 62 goals, vs Denmark 24 Sep 2026 — see
CLAUDE.md / SOURCES.md for the sourcing on the underlying record itself).

- **Intro clip job id: `693f664d-0282-4590-80e1-96449562d465`** (7.05s,
  stat-reveal motion graphic, 62→63→64 counter, Norway/Sweden flag icons,
  no real people/faces/club crests — abstract broadcast-graphics style
  only, to stay consistent with the site's own policy of not using real
  club/competition logos or player photos). On-screen text: "ALL-TIME TOP
  SCORER" / "NORDIC NATIONS" (two lines) + "64 INTERNATIONAL GOALS"
  subtitle — deliberately simplified to short, plain, common words with no
  diacritics, after the first attempt (below) rendered misspelled text.
- **Final assembled video (intro + 4s hold + standard ending + 2s hold):**
  media_id `f14bd2a3-9bf5-4dc1-9d4b-cd5bd720393a`,
  `https://d2ol7oe51mr4n9.cloudfront.net/user_3Ipc1bcrZt27tWpXOoyuXF8Mztc/f14bd2a3-9bf5-4dc1-9d4b-cd5bd720393a.mp4`
  (19.15s, 1920x1080, h264/aac). **Use this one.**

**Superseded — do not use:** intro clip job `05364a16-d282-4301-8118-c24e541ac93e`
and assembled video media_id `2b270811-33de-4d35-aeac-812490c3f997`. The
on-screen subtitle text was misspelled ("Haeland" instead of "Haaland",
"Ibabuıovic" instead of "Ibrahimović" — caught by extracting and visually
inspecting the clip's last frame before shipping). That earlier version
also predates the 4s/2s hold rules above. Lesson: always extract and view
the last frame of a generated clip with on-screen text before using it —
see "Text-rendering risk" note below.

**Text-rendering risk:** printed/on-screen text in AI-generated video is
unreliable, especially longer words and names with diacritics. Mitigate by
keeping on-screen text short and plain (push detail like "Ibrahimović" into
the social caption instead of baking it into the video), explicitly
instructing "perfect, correctly spelled, no misspellings" in the prompt,
and always verifying by extracting the last frame
(`ffmpeg -y -sseof -0.2 -i clip.mp4 -frames:v 1 -update 1 -q:v 2 out.jpg`,
viewed via `sandbox_exec`'s `image_paths`) before shipping.

Next time: reuse the standard ending clip as-is, generate a new ~6-8s intro
for whichever record is being featured, and follow the same sandbox_exec
concat recipe above (including the 4s/2s hold filters).
