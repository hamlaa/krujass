# งานในทางวิทยาศาสตร์ (Work in physics): an interactive presentation

This is a cinematic, touch-first lesson for Thai high-school physics (ม.4–ม.6).
It covers six situations, and in each one the student watches an animated
scene and decides **เกิดงาน / ไม่เกิดงาน** (work is done / no work is done).
They then get instant feedback, the reasoning, and force/displacement overlays,
and the lesson ends with a summary built around **W = Fs cosθ**.

It is designed for iPad Safari (landscape), touch displays and classroom
projectors. It works fully offline once loaded: fonts, art and sounds are all
local, and there are no network or API calls at runtime.

| # | Situation | Answer | Why |
|---|-----------|--------|-----|
| 01 | Boy pushes a shopping cart | เกิดงาน | F is along s (θ = 0°) |
| 02 | Worker carries a beam at constant height | ไม่เกิดงาน | Supporting force ⟂ s (θ = 90°) |
| 03 | Woman sits working at a laptop | ไม่เกิดงาน | s = 0 |
| 04 | Woman climbs stairs | เกิดงาน | Lifts her body through height h |
| 05 | Woman pulls a suitcase | เกิดงาน | F cosθ is along s |
| 06 | Mannequin pushes a wardrobe that doesn't move | ไม่เกิดงาน | s = 0 |

---

## 1. Run with Docker (recommended for the classroom)

You need Docker with the Compose plugin.

```bash
cd labs/presentation
docker compose up -d --build      # builds (runs typecheck + tests) and starts nginx
```

The presentation is then served on port **8080**.

* On the same computer, open <http://localhost:8080>.
* To use a different port, run `cp .env.example .env` and set `PORT=9000`, or
  run `PORT=9000 docker compose up -d --build`.

Other commands:

```bash
docker compose logs -f            # view logs
docker compose ps                 # status and health check
docker compose down               # stop and remove the container
docker compose up -d --build      # rebuild after editing the source
```

The container has `restart: unless-stopped`, so it comes back after a reboot
until you run `docker compose down`.

## 2. Open it on an iPad over the LAN

1. Connect the computer running Docker and the iPad to the **same Wi-Fi/LAN**.
2. Find the computer's LAN IP address:
   * Linux: `hostname -I` or `ip -4 addr show` (look for e.g. `192.168.1.23`)
   * macOS: `ipconfig getifaddr en0`
   * Windows: `ipconfig` (the "IPv4 Address" line)
3. On the iPad, open Safari and go to `http://192.168.1.23:8080`, using your IP.
4. Optional but recommended: tap **Share → Add to Home Screen**. Opening the
   presentation from the home-screen icon runs it full-screen in landscape,
   without Safari's toolbars.
5. Set the volume on the iPad or on the projector speakers. There is
   deliberately no mute button. Sound starts with the first tap on
   **เริ่มบทเรียน** (an iOS rule). On iPhone/iPad the ring/silent switch can
   also mute web audio.

If the iPad can't connect:

* Make sure the host firewall allows inbound TCP on port 8080. For example:
  * `sudo ufw allow 8080/tcp` (Ubuntu)
  * `sudo firewall-cmd --add-port=8080/tcp` (Fedora/Arch with firewalld)
  * On Windows, allow Docker Desktop through the firewall.
* Some school or guest Wi-Fi networks isolate clients from each other. In that
  case, use a phone hotspot or a network that allows device-to-device traffic.
* Check that the server responds with `curl http://localhost:8080/healthz`,
  which should print `ok`.

## 3. Development (without Docker)

You need Node.js 20 or newer (the Docker build uses Node 24).

```bash
npm ci
npm run dev        # Vite dev server: http://localhost:5173
npm run dev -- --host   # also reachable from the iPad at http://<LAN-IP>:5173
npm test           # unit tests (vitest)
npm run typecheck  # TypeScript only
npm run build      # typecheck + production build into dist/
npm run preview    # serve dist/ locally
```

`dist/` is a plain static site with relative paths, so it also works from any
static host or a sub-folder.

## 4. Presenting

Navigation is **forward only**: Intro → 01 → 02 → … → 06 → สรุป. There is no
back button and no way to jump to a scene, so the class follows one sequence.
A quiet "สถานการณ์ 03 / 06" line shows progress but can't be clicked.

| Action | Touch | Keyboard / presenter clicker |
|--------|-------|----------|
| Next slide | **ถัดไป** (it becomes the highlighted button once the question is answered) | → · PageDown · Space |
| Continue during a chapter title | tap the title screen | → · PageDown · Space |
| Play / replay the scene | **เล่นแอนิเมชัน** or tap the picture · เล่นซ้ำ | Enter or P |
| Answer เกิดงาน / ไม่เกิดงาน | answer buttons | 1 / 2 |
| Close / reopen the explanation | × · ดูคำอธิบาย | Esc |
| Start again | **เริ่มใหม่** on the summary | — |
| Full screen | ⛶ (intro screen) | F |

Each slide stages one obvious action at a time. The title comes first, then
the orange **เล่นแอนิเมชัน** button. After playback the two large answer buttons
take over. After answering, the feedback and physics arrows appear and
**ถัดไป** becomes the orange primary button.

Chapter titles between slides enter in about 0.55 s, stay fully readable for
1.3 s and exit in about 0.5 s, so each whole transition takes about 2.6 s. Each
transition's own cover and reveal play proportionally faster to fit. The timings
are `TITLE_TIMING` in `src/animations/transitions.ts`. A tap, or the next key,
during the hold continues early.

When the page first loads, an invitation offers **เปิดเต็มหน้าจอ** (native
fullscreen, requested from that tap) or **ยกเลิก** / ×. It appears once per page
load. If the browser has no native fullscreen (for example iPhone Safari), or
refuses the request, the presentation continues in normal mode and says so.

Each scene runs idle → playing → ready to answer → answered. The answer
buttons appear only after the animation has been watched, and each scene can
be answered once. After that, replay still works and the explanation can be
reopened. **เริ่มใหม่** on the summary resets every scene. There are no
scores, timers or rewards.

If the device has *Reduce Motion* turned on, the slide transitions become
cross-fades (the chapter title still holds so it can be read) and the
decorative motion is removed. The scene animations still
play, because they are the content the students are asked to judge.

### Sound

All sound effects are real CC0 foley recordings from Freesound, edited into
115 short local files (about 1.5 MB). Sources and licences are listed in
[`SFX_SOURCES.md`](SFX_SOURCES.md).

- Each scene layers several close-mic sounds, timed to its animation:
  footsteps from the walking gait, rolling wheels whose level, pitch and stereo
  position follow the real speed, wood creaks, fabric, breathing (no voice),
  desk sounds and the wardrobe's strain. The wardrobe never makes a sliding
  sound.
- Repeated sounds rotate through different takes with small pitch and level
  variation.
- Every voice is faded out when a scene is replayed or the slide changes.
- The mix has three buses with a soft room reverb, a glue compressor and a
  limiter. In testing, peaks stayed around −7 dBFS, well below a teacher's voice
  at normal classroom volume.
- There is no music and no narration.

## 5. Project structure

```
src/
  data/scenarios.ts      lesson content (Thai text, answers, colours, per-scene transition/feedback)
  state/sceneMachine.ts  per-scene state machine + deck reducer
  rig/                   SVG skeletal rig: bones, 2-bone IK, planted-foot gait, GSAP runtime
  scenes/*.tsx           six illustrated, animated scenes (one style each) + physics overlays
  animations/            slide transitions and entrance presets
  audio/soundEngine.ts   sample-based Web Audio engine (buses, reverb, variants, loops, voice limits)
  audio/samples/         115 processed CC0 recordings · audio/sfxManifest.ts (generated)
  components/ slides/    UI, intro, scene and summary slides
  tests/                 vitest unit tests
scripts/audio/           build_sfx.py + sources.json: download / slice / normalise the recordings
docker/                  nginx site config + security headers
Dockerfile, compose.yaml multi-stage Node build → nginx runtime
```

## 6. Security notes

* The presentation is static. It has no backend, makes no runtime API calls and
  sends no analytics. The nginx Content-Security-Policy only allows the site's
  own files.
* No API keys are needed to build or run it. `.env*`, key files and the
  `scripts/` folder are excluded from the Docker build context by
  `.dockerignore`. See `scripts/asset-generation/README.md`.
