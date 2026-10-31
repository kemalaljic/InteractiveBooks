# Storybook Apps

Interactive tap-to-hear picture books for iPad (HR/BS + EN). Vite + TypeScript, PixiJS v8, Rive, Howler, installable offline PWA.

Prototype: **"Mala žaba", page 1 (the pond).**

## Run

```bash
npm install
npm run dev -- --host        # then open http://<PC-LAN-IP>:5173 on the iPad
npm run build && npm run preview -- --host   # production build + service worker (test offline here)
```

Pages are chosen by URL: `?book=mala-zaba&page=1` (default).

## Layout

```
src/
  main.ts                 boot: preload audio, build scene, start screen (sync unlock)
  core/types.ts           content schema (PageConfig, SceneObjectConfig)
  core/assets.ts          URL helpers + file-name conventions
  content/                books as DATA. One file per page, registered in content/index.ts
  audio/AudioManager.ts   Howler wrapper: sync unlock, visibilitychange resume, narration ducking, ambient fades
  scene/Stage.ts          Pixi app, 1600x1200 world scaled to fit, parallax camera
  scene/painters.ts       procedural prototype backgrounds (sky, far bank, water + shimmer)
  scene/Particles.ts      sparkles, bubbles, splashes, confetti
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

## Adding audio

Placeholders (synthesized beeps and chimes) are in `public/audio/`. Narration placeholders are chimes; the caption carries the words.

1. Put raw recordings in `raw-audio/{narration,sfx,ambient}/` with ASCII names (`zaba`, not `žaba`)
2. `npm run audio:normalize` → loudnorm `I=-16:TP=-1.5:LRA=11`, silence trimmed (not for ambient loops), MP3 → `public/audio/...`

Files this page expects:

| File | Line |
|---|---|
| narration/mala-zaba-1-intro.mp3 | Ovo je jezero. Tu živi mala žaba. |
| narration/mala-zaba-1-zaba.mp3 | Kre-kre! Ja sam mala žaba. |
| narration/mala-zaba-1-lopoc.mp3 | Ovo je lopoč. Na njemu raste cvijet. |
| narration/mala-zaba-1-vilin-konjic.mp3 | Vilin konjic leti iznad vode. Bzzz! |
| narration/mala-zaba-1-riba.mp3 | Riba skače iz vode. Pljus! |
| narration/mala-zaba-1-trska.mp3 | Trska se njiše na vjetru. Šššš! |
| narration/mala-zaba-1-bravo.mp3 | Bravo! Sve smo pronašli! |
| sfx/zaba, lopoc, vilin-konjic, riba, trska, bravo .mp3 | frog croak, plop, buzz, splash, rustle, fanfare |
| ambient/mala-zaba-1.mp3 | pond loop |

## Adding a Rive character

1. Export `public/rive/zaba.riv` with a state machine named **`Main`**, trigger inputs **`tap`** (and optional **`happy`**). Put the idle animation in the state machine's default state.
2. In the page config: `art: { placeholder: 'frog', rive: { src: 'rive/zaba.riv', width: 320, height: 300 } }`.
If the file is missing or fails to load, the placeholder is used automatically.

## Adding a page or book

Copy `src/content/mala-zaba/page1.ts`, change ids, positions (1600x1200 world; keep objects below y≈330 so the caption never covers them), captions and sounds, then register it in `src/content/index.ts`. For painted art, use `{ id, parallax, image: 'art/xyz/sky.webp', x, y, width, height }` layers instead of the procedural painters.

## Deploy (Cloudflare Pages)

Build command `npm run build`, output directory `dist`. `base: './'` makes it work from any path.
