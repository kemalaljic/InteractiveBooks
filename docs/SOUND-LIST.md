# Sound shopping list

Every sound in the app is currently a **synthesized placeholder**. Replace them with real recordings from
[Freesound](https://freesound.org) or [Pixabay Sounds](https://pixabay.com/sound-effects/). Download by hand:
their terms don't allow automated downloading.

## How to deliver them

1. Download a sound and **rename it** to the exact name in the "Save as" column. Keep its own extension
   (`.wav`, `.mp3`, `.flac`, `.ogg` or `.m4a` are all fine). Use ASCII names only: `zaba`, not `žaba`.
2. Put it in the folder named in the section heading: `raw-audio/ambient/` or `raw-audio/sfx/`.
3. Then either:
   - **Easy:** commit and push the files. Claude normalizes them and updates `public/audio/`.
   - **Yourself:** in Git Bash (needs ffmpeg) run `npm run audio:normalize`, then refresh the iPad.

You don't need everything at once. Any file you don't supply keeps its placeholder.

## Licence rules

| Source | OK? | What to do |
|---|---|---|
| Freesound **CC0** | ✅ best | Nothing required. Still note it in `public/audio/CREDITS.md` |
| Freesound **CC BY** (Attribution) | ✅ | **Must** add author + link to `public/audio/CREDITS.md` |
| Freesound **CC BY-NC** | ⚠️ | Fine for family use; avoid if the app might ever be sold |
| Pixabay | ✅ | Pixabay Content License; no attribution needed |

On Freesound, use the **License** filter on the left of the search results and tick "Creative Commons 0".

## What makes a good pick

- **Clean:** no voices, traffic, planes, music or wind rumble on the microphone.
- **Gentle:** this is for a toddler. Avoid harsh, startling or very loud sounds.
- **SFX:** one clear event, 0.5–3 seconds. Silence at the start and end is trimmed automatically.
- **Ambient loops:** 30 seconds to 2 minutes, steady, with nothing that stands out (no single loud bird
  call), because it will repeat. The loop seam is cross-faded automatically.
- Keep each file under ~50 MB (GitHub limit is 100 MB). A 1–2 minute WAV is fine.

---

## Ambient loops → `raw-audio/ambient/`

These play quietly underneath everything, several at once.

| Save as | Page | What it is | Search for |
|---|---|---|---|
| `jezero-voda` | 1 + 2 | Water gently lapping at a pond/lake shore | `water lapping shore`, `lake shore gentle`, `pond water` |
| `jezero-ptice` | 1 | Distant mixed birdsong, morning | `birdsong morning forest`, `birds distant ambience` |
| `jezero-vjetar` | 1 | Soft breeze in leaves | `wind leaves gentle`, `breeze trees rustle` |
| `noc-cvrcci` | 2 | Crickets at night | `crickets night`, `night ambience crickets` |
| `noc-zabe` | 2 | Distant frog chorus at night | `frog chorus night`, `frogs pond night` |

## Random background calls → `raw-audio/sfx/`

Short sounds the app plays at random moments, from random directions, inside the ambience.

| Save as | Page | What it is | Search for |
|---|---|---|---|
| `ptica-cvrkut-1` | 1 | One short bird chirp (2–4 notes) | `bird chirp single`, `sparrow chirp` |
| `ptica-cvrkut-2` | 1 | A *different* short chirp | `robin chirp`, `small bird tweet` |
| `zaba-daleko` | 1 + 2 | One frog croak, far away | `frog croak distant` |
| `riba-pljus-mali` | 1 | Tiny plop, a fish touching the surface | `water drop plop`, `small plop water` |
| `sova-daleko` | 2 | Owl hooting far away | `tawny owl distant`, `owl hoot night far` |

## Tap sounds → `raw-audio/sfx/`

Played when the child taps the object. These matter most, so do these first.

| Save as | Page | Object | Search for |
|---|---|---|---|
| `zaba` | 1 + 2 | Frog 🐸 | `frog croak`, `frog ribbit` |
| `patka` | 1 | Duck 🦆 | `duck quack` |
| `ptica` | 1 | Bird singing on the tree 🐦 | `blackbird song short`, `robin song`, `songbird` |
| `riba` | 1 | Fish jumps out and back in 🐟 | `fish jump splash`, `water splash small` |
| `lopoc` | 1 | Lily pad wobbles 🪷 | `water plop`, `object drop water small` |
| `vilin-konjic` | 1 | Dragonfly does a loop | `dragonfly wings`, `insect wings buzz flutter` |
| `trska` | 1 | Reeds sway | `reeds rustle`, `tall grass rustle` |
| `leptir` | 1 | Butterfly 🦋 (silent in nature, so a soft magical sound) | `soft wing flutter`, `magic twinkle soft` |
| `sova` | 2 | Owl 🦉 "hu-huu" | `tawny owl hoot`, `owl hooting` |
| `cvrcak` | 2 | Cricket close-up | `cricket chirp close`, `cricket single` |
| `krijesnice` | 2 | Fireflies ✨ (silent, so sparkly) | `sparkle twinkle soft`, `magic chimes short` |
| `mjesec` | 2 | Moon 🌙 (silent, so a gentle chime) | `soft chime`, `music box note`, `gentle bell` |
| `bravo` | all | Reward fanfare 🎉 | `success jingle kids`, `short fanfare cheerful` |

Tip: the European **tawny owl** makes the classic "hu-huuu". Many "owl" results are American species that sound different.

## Narration → `raw-audio/narration/`

Recorded voice. Not from sound libraries. Record yourself (phone voice memo is fine) or use ElevenLabs.
Speak slowly and warmly, leave a second of silence before and after.

| Save as | Text |
|---|---|
| `mala-zaba-1-intro` | Ovo je jezero. Tu živi mala žaba. |
| `mala-zaba-1-zaba` | Kre-kre! Ja sam mala žaba. |
| `mala-zaba-1-lopoc` | Ovo je lopoč. Na njemu raste cvijet. |
| `mala-zaba-1-vilin-konjic` | Vilin konjic leti iznad vode. Bzzz! |
| `mala-zaba-1-riba` | Riba skače iz vode. Pljus! |
| `mala-zaba-1-trska` | Trska se njiše na vjetru. Šššš! |
| `mala-zaba-1-patka` | Patka pliva po jezeru. Kva-kva! |
| `mala-zaba-1-leptir` | Šareni leptir leti iznad trave. |
| `mala-zaba-1-ptica` | Ptičica pjeva na drvetu. Ćiju-ćiju! |
| `mala-zaba-1-bravo` | Bravo! Sve smo pronašli! |
| `mala-zaba-2-intro` | Pala je noć. Mala žaba ne spava. |
| `mala-zaba-2-mjesec` | Mjesec sja na nebu. Laku noć, mjeseče! |
| `mala-zaba-2-sova` | Sova sjedi na grani. Hu-hu! |
| `mala-zaba-2-zaba` | Žaba pjeva noćnu pjesmu. Kre-kre! |
| `mala-zaba-2-krijesnice` | Krijesnice svijetle u mraku. |
| `mala-zaba-2-cvrcak` | Cvrčak pjeva: cvrć, cvrć! |
| `mala-zaba-2-bravo` | Bravo! Laku noć, mala žabo! |

Page 2 text is a **draft**. If the original "Mala žaba" book has different wording, change it in
`src/content/mala-zaba/page2.ts` (captions) and record to match.
