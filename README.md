# Storybook Apps

Interactive tap-to-hear picture books for iPad (HR/BS + EN). Vite + TypeScript, PixiJS v8, Rive, Howler, installable offline PWA.

Prototype: **"Mala žaba"**, page 1 (the pond by day, 8 animals and things) and page 2 (night at the pond, 5).

## Run

```bash
npm install
npm run dev -- --host        # then open http://<PC-LAN-IP>:5173 on the iPad
npm run build && npm run preview -- --host   # production build + service worker (test offline here)
```

Turn pages with the **Dalje ➜** button on the Bravo screen (no reload, so audio stays unlocked). To jump straight to a page for testing: `?book=mala-zaba&page=2`.

## Layout

```
src/
  main.ts                 boot: preload audio, build scene, start screen (sync unlock)
  core/types.ts           content schema (PageConfig, SceneObjectConfig)
  core/assets.ts          URL helpers + file-name conventions
  content/                books as DATA. One file per page, registered in content/index.ts
  audio/AudioManager.ts   Howler wrapper: sync unlock, visibilitychange resume, narration + SFX, ducking
  audio/AmbientBed.ts     layered gapless ambient loops + random one-shots (raw Web Audio)
  scene/Stage.ts          Pixi app, 1600x1200 world scaled to fit, parallax camera
  scene/painters.ts       procedural prototype backgrounds (sky, far bank, water + shimmer)
  scene/Particles.ts      sparkles, bubbles, splashes, confetti
  scene/Book.ts           page sequence, in-app page turns with curtain + ambient cross-fade
  scene/PageController.ts taps → reaction + SFX + narration + caption, progress, Bravo
  characters/Character.ts the swappable interface
  characters/PlaceholderCharacter.ts + motion.ts + placeholderArt.ts   vector stand-ins
  characters/RiveCharacter.ts   .riv → Pixi texture, state machine "Main", inputs tap/happy
  ui/                     start screen, caption (top), stars, Bravo overlay
scripts/                  audio pipeline, placeholder audio, icon render
```

## iOS rules (as implemented)

| Rule | Where |
|---|---|
| Audio unlock fully synchronous in first tap | `ui/StartScreen.ts` → `AudioManager.unlock()` (touchend/click, no await before it; plays a silent buffer; sets `navigator.audioSession.type = 'playback'` so the mute switch doesn't silence it) |
| Resume after backgrounding | `AudioManager.installLifecycleHandlers()`: visibilitychange, pageshow, focus, plus retry on every tap |
| Caption at the top | `.caption` in `ui/styles.css` |
| Big, forgiving tap targets | `PageController.pick()`: hit radius ≥ 50 CSS px (100 px target) + 40 px slop; nearest object wins; follows moving objects |
| No runtime network | Rive wasm bundled (`RuntimeLoader.setWasmUrl`, CDN fallback disabled); no web fonts; Workbox precaches all js/css/wasm/png/mp3/riv |

## Audio

All audio is **synthesized placeholder** for now (`npm run audio:placeholders` regenerates it; needs python3 + numpy + ffmpeg).

**→ [docs/SOUND-LIST.md](docs/SOUND-LIST.md)** has every file the book needs: what to search for on Freesound/Pixabay, what to name it, licence rules, and all narration lines.

Pipeline: drop files into `raw-audio/{ambient,sfx,narration}/` → `npm run audio:normalize` (Git Bash + ffmpeg) → `public/audio/`.
- loudnorm `I=-16:TP=-1.5:LRA=11`, MP3
- SFX + narration: leading/trailing silence trimmed
- Ambient: last 2 s cross-faded into the first 2 s, so the file loops seamlessly

### Soundscape

Each page's `ambient` config mixes several loops and fires short "sprinkles" (bird chirps, a distant frog) at random intervals with random stereo position and slight pitch variation. All of it ducks under narration. Loops run on raw Web Audio with loop points set past the MP3 encoder padding, so there is no gap at the seam (`src/audio/AmbientBed.ts`).

## Adding a Rive character

1. Export `public/rive/zaba.riv` with a state machine named **`Main`**, trigger inputs **`tap`** (and optional **`happy`**). Put the idle animation in the state machine's default state.
2. In the page config: `art: { placeholder: 'frog', rive: { src: 'rive/zaba.riv', width: 320, height: 300 } }`.
If the file is missing or fails to load, the placeholder is used automatically.

## Adding a page or book

Copy `src/content/mala-zaba/page1.ts`, change ids, positions (1600x1200 world; keep objects below y≈330 so the caption never covers them), captions and sounds, then register it in `src/content/index.ts`. For painted art, use `{ id, parallax, image: 'art/xyz/sky.webp', x, y, width, height }` layers instead of the procedural painters.

## Deploy (Cloudflare Pages)

Build command `npm run build`, output directory `dist`. `base: './'` makes it work from any path.
